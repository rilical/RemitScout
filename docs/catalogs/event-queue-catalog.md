| Name | Type | Producer | Consumer | Schema | DLQ | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| CollectionTaskQueue | Queue | Ingestion scheduler | Collector workers | TODO | TODO | Decouple scheduling from execution. |
| ExportJobQueue | Queue | Plane A exports API | Export worker | TODO | TODO | Gold-only export jobs. |
