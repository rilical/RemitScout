#!/usr/bin/env python3

"""
Cost-controlled dev smoke window (read/write AWS, but timeboxed).

What it does:
- Keeps EventBridge Rules DISABLED (does not toggle schedules).
- Starts the dev Aurora cluster.
- Scales selected ECS queue workers to desired=1.
- Polls SQS queues + DLQs for a short window.
- Scales ECS back to 0 and stops Aurora.

Why:
- Proves "Fargate can consume" without re-enabling fanout schedules.
- Avoids the unsafe behavior of unpausing via OpsPause (which re-enables *all* rules).

Usage:
  python3 scripts/audit/dev_smoke_window.py

Env overrides:
  AWS_PROFILE=rs-dev
  AWS_REGION=us-east-1
  WINDOW_SECONDS=600
"""

from __future__ import annotations

import datetime as dt
import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any, Iterable

import boto3
from botocore.config import Config


DEFAULT_PROFILE = os.environ.get("AWS_PROFILE", "rs-dev")
DEFAULT_REGION = os.environ.get("AWS_REGION", "us-east-1")
WINDOW_SECONDS = int(os.environ.get("WINDOW_SECONDS", "600"))

ECS_CLUSTER_NAME = os.environ.get("ECS_CLUSTER_NAME", "remit-scout-dev")

# We intentionally exclude PlaneBIngestService (non-queue, can be heavy).
SERVICE_NAME_CONTAINS = (
    "B2cRefreshWorkerService",
    "FxRateRefreshWorkerService",
    "IngestFanoutTier1WorkerService",
    "IngestFanoutTier2WorkerService",
    "GoldLiveWorkerService",
    "NotificationsQueueWorkerService",
    "OpsAlertsQueueWorkerService",
)

QUEUE_PREFIX = os.environ.get("QUEUE_PREFIX", "remit-scout-dev")


@dataclass(frozen=True)
class SmokeResult:
    profile: str
    region: str
    started_at_utc: str
    window_seconds: int
    cluster_name: str
    db_cluster_id: str | None
    ecs_services_scaled_up: list[str]
    ecs_services_scaled_down: list[str]
    sqs_snapshots: list[dict[str, Any]]
    notes: list[str]


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def sleep(seconds: float) -> None:
    time.sleep(seconds)


def boto_session(profile: str) -> boto3.Session:
    return boto3.Session(profile_name=profile)


def pretty(obj: Any) -> str:
    return json.dumps(obj, indent=2, default=str, sort_keys=True)


def wait_until(
    *,
    deadline: dt.datetime,
    interval_seconds: float,
    condition_name: str,
    condition_fn,
) -> bool:
    while utc_now() < deadline:
        if condition_fn():
            return True
        sleep(interval_seconds)
    print(f"timeout waiting for: {condition_name}", file=sys.stderr)
    return False


def list_ecs_service_arns(ecs, cluster_arn: str) -> list[str]:
    arns: list[str] = []
    paginator = ecs.get_paginator("list_services")
    for page in paginator.paginate(cluster=cluster_arn):
        arns.extend(page.get("serviceArns", []))
    return arns


def describe_ecs_services(ecs, cluster_arn: str, service_arns: list[str]) -> list[dict[str, Any]]:
    if not service_arns:
        return []
    out: list[dict[str, Any]] = []
    for i in range(0, len(service_arns), 10):
        chunk = service_arns[i : i + 10]
        resp = ecs.describe_services(cluster=cluster_arn, services=chunk)
        out.extend(resp.get("services", []))
    return out


def list_sqs_queue_urls(sqs, prefix: str) -> list[str]:
    resp = sqs.list_queues(QueueNamePrefix=prefix)
    return sorted(resp.get("QueueUrls", []))


def get_sqs_depths(sqs, queue_urls: Iterable[str]) -> dict[str, dict[str, Any]]:
    attrs = [
        "ApproximateNumberOfMessages",
        "ApproximateNumberOfMessagesNotVisible",
        "ApproximateNumberOfMessagesDelayed",
    ]
    out: dict[str, dict[str, Any]] = {}
    for url in queue_urls:
        name = url.split("/")[-1]
        resp = sqs.get_queue_attributes(QueueUrl=url, AttributeNames=attrs)
        out[name] = resp.get("Attributes", {})
    return out


def pick_dev_db_cluster_id(rds) -> str | None:
    clusters = rds.describe_db_clusters().get("DBClusters", [])
    # Prefer stack-named cluster.
    for c in clusters:
        ident = c.get("DBClusterIdentifier", "")
        if ident.startswith("remit-scout-dev-") and "auroracluster" in ident:
            return ident
    # Fallback: any aurora-postgresql cluster containing remit.
    for c in clusters:
        ident = c.get("DBClusterIdentifier", "")
        if "remit" in ident.lower() and c.get("Engine", "").startswith("aurora-postgresql"):
            return ident
    return None


def main() -> int:
    started_at = utc_now()
    notes: list[str] = []

    session = boto_session(DEFAULT_PROFILE)
    client_config = Config(retries={"max_attempts": 3})

    ecs = session.client("ecs", region_name=DEFAULT_REGION, config=client_config)
    rds = session.client("rds", region_name=DEFAULT_REGION, config=client_config)
    sqs = session.client("sqs", region_name=DEFAULT_REGION, config=client_config)

    # Resolve cluster ARN.
    clusters = ecs.list_clusters().get("clusterArns", [])
    cluster_arn = next((c for c in clusters if c.endswith(f"/{ECS_CLUSTER_NAME}")), None)
    if not cluster_arn:
        print(f"cluster not found: {ECS_CLUSTER_NAME} in {DEFAULT_REGION}", file=sys.stderr)
        return 2

    all_service_arns = list_ecs_service_arns(ecs, cluster_arn)
    all_services = describe_ecs_services(ecs, cluster_arn, all_service_arns)
    selected_services = [
        s for s in all_services if any(token in s.get("serviceName", "") for token in SERVICE_NAME_CONTAINS)
    ]
    selected_service_names = sorted([s["serviceName"] for s in selected_services])
    if not selected_service_names:
        print("no target services found (unexpected)", file=sys.stderr)
        return 2

    db_cluster_id = pick_dev_db_cluster_id(rds)
    if not db_cluster_id:
        notes.append("db_cluster_id_not_found")

    queue_urls = list_sqs_queue_urls(sqs, QUEUE_PREFIX)
    dlq_names = [u.split("/")[-1] for u in queue_urls if u.split("/")[-1].endswith("-dlq")]

    sqs_snapshots: list[dict[str, Any]] = []
    ecs_scaled_up: list[str] = []
    ecs_scaled_down: list[str] = []

    def snapshot(label: str) -> None:
        depths = get_sqs_depths(sqs, queue_urls)
        dlq_nonzero = {
            name: depths[name]
            for name in dlq_names
            if int(depths.get(name, {}).get("ApproximateNumberOfMessages", "0") or "0") > 0
        }
        sqs_snapshots.append(
            {
                "ts_utc": utc_now().isoformat(),
                "label": label,
                "depths": depths,
                "dlq_nonzero": dlq_nonzero,
            }
        )

    snapshot("before")

    try:
        # Start DB (if present).
        if db_cluster_id:
            status = rds.describe_db_clusters(DBClusterIdentifier=db_cluster_id)["DBClusters"][0]["Status"]
            if status not in ("available", "starting"):
                print(f"starting db cluster: {db_cluster_id} (status={status})")
                rds.start_db_cluster(DBClusterIdentifier=db_cluster_id)

            def db_ready() -> bool:
                s = rds.describe_db_clusters(DBClusterIdentifier=db_cluster_id)["DBClusters"][0]["Status"]
                return s == "available"

            wait_until(
                deadline=utc_now() + dt.timedelta(minutes=15),
                interval_seconds=15,
                condition_name="db_cluster_available",
                condition_fn=db_ready,
            )

        # Scale selected queue workers up to 1.
        print("scaling ecs services to desired=1:", ", ".join(selected_service_names))
        for name in selected_service_names:
            ecs.update_service(cluster=cluster_arn, service=name, desiredCount=1)
            ecs_scaled_up.append(name)

        def services_running() -> bool:
            resp = ecs.describe_services(cluster=cluster_arn, services=selected_service_names)
            svcs = resp.get("services", [])
            return all((s.get("runningCount", 0) or 0) >= 1 for s in svcs)

        wait_until(
            deadline=utc_now() + dt.timedelta(minutes=10),
            interval_seconds=10,
            condition_name="ecs_services_running>=1",
            condition_fn=services_running,
        )

        # Poll queues for the window.
        deadline = utc_now() + dt.timedelta(seconds=WINDOW_SECONDS)
        while utc_now() < deadline:
            snapshot("window")
            # If any DLQ has messages, record and continue (we still want cleanup).
            sleep(30)

    finally:
        # Scale down services and stop DB no matter what.
        print("scaling ecs services back to desired=0")
        for name in selected_service_names:
            try:
                ecs.update_service(cluster=cluster_arn, service=name, desiredCount=0)
                ecs_scaled_down.append(name)
            except Exception as e:
                notes.append(f"ecs_scale_down_failed:{name}:{e}")

        if db_cluster_id:
            try:
                status = rds.describe_db_clusters(DBClusterIdentifier=db_cluster_id)["DBClusters"][0]["Status"]
                if status not in ("stopped", "stopping"):
                    print(f"stopping db cluster: {db_cluster_id} (status={status})")
                    rds.stop_db_cluster(DBClusterIdentifier=db_cluster_id)
            except Exception as e:
                notes.append(f"db_stop_failed:{e}")

        snapshot("after")

    result = SmokeResult(
        profile=DEFAULT_PROFILE,
        region=DEFAULT_REGION,
        started_at_utc=started_at.isoformat(),
        window_seconds=WINDOW_SECONDS,
        cluster_name=ECS_CLUSTER_NAME,
        db_cluster_id=db_cluster_id,
        ecs_services_scaled_up=ecs_scaled_up,
        ecs_services_scaled_down=ecs_scaled_down,
        sqs_snapshots=sqs_snapshots,
        notes=notes,
    )

    out_dir = os.path.join(
        "docs",
        "audits",
        "2026-02-10-a2z-audit",
        "evidence",
        "aws",
        "rs-dev",
        DEFAULT_REGION,
    )
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"dev-smoke-window-{started_at.strftime('%Y%m%dT%H%M%SZ')}.json")
    with open(out_path, "w") as f:
        json.dump(result.__dict__, f, indent=2, default=str)
    print(f"wrote smoke result: {out_path}")

    # Print DLQ violations if any.
    dlq_ever_nonzero = False
    for snap in sqs_snapshots:
        if snap.get("dlq_nonzero"):
            dlq_ever_nonzero = True
            break
    if dlq_ever_nonzero:
        print("DLQ became non-zero during the window. See smoke result JSON.", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

