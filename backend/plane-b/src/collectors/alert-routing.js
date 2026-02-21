"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyBlockAlert = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../../shared/config");
const logger_1 = require("../../../shared/logger");
const error_handling_1 = require("../../../shared/utils/error-handling");
const repositories_1 = require("../repositories");
const logger = (0, logger_1.createLogger)('plane-b.alerts');
let emailTransporter = null;
const loadOpsAlertEvent = async (pool, alertId) => {
    const repo = new repositories_1.OpsAlertRepository(pool);
    return repo.getAlert(alertId);
};
const normalizePayload = (payload) => {
    if (!payload || typeof payload !== 'object')
        return {};
    return payload;
};
const getEmailTransporter = () => {
    const emailConfig = config_1.config.alerts.email;
    const hasConfig = Boolean(emailConfig.smtpHost) && emailConfig.to.length > 0 && Boolean(emailConfig.from);
    if (!emailConfig.enabled || !hasConfig)
        return null;
    if (emailTransporter)
        return emailTransporter;
    emailTransporter = nodemailer_1.default.createTransport({
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        secure: emailConfig.smtpSecure,
        auth: emailConfig.smtpUser
            ? {
                user: emailConfig.smtpUser,
                pass: emailConfig.smtpPass,
            }
            : undefined,
    });
    return emailTransporter;
};
const buildAlertText = (event, payload) => {
    const payinMethod = payload.payin_method ?? 'n/a';
    const payoutMethod = payload.payout_method ?? 'n/a';
    const collectorType = payload.collector_type ?? 'n/a';
    const traceId = payload.trace_id ?? event.request_id ?? 'n/a';
    const fingerprint = payload.request_fingerprint ?? 'n/a';
    return [
        `Provider block detected (${event.provider_id ?? 'unknown'}).`,
        `Corridor: ${event.corridor_id ?? 'unknown'}`,
        `Amount bucket: ${event.amount_bucket ?? 'n/a'}`,
        `Payin/Payout: ${payinMethod} -> ${payoutMethod}`,
        `HTTP: ${event.http_status ?? 'n/a'}`,
        `Reason: ${event.block_reason ?? 'unknown'}`,
        `Collector: ${collectorType}`,
        `Trace: ${traceId}`,
        `Fingerprint: ${fingerprint}`,
        `Alert ID: ${event.alert_id}`,
    ].join('\n');
};
const sendSlackAlert = async (text) => {
    const webhookUrl = config_1.config.alerts.slackWebhookUrl;
    if (!webhookUrl)
        return false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                text: `:rotating_light: Block alert\n${text}`,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`slack_webhook_failed:${response.status}`);
        }
        return true;
    }
    catch (error) {
        clearTimeout(timeoutId);
        if ((0, error_handling_1.isError)(error) && error.name === 'AbortError') {
            throw new Error('slack_webhook_timeout');
        }
        throw error;
    }
};
const sendEmailAlert = async (subject, text) => {
    const emailConfig = config_1.config.alerts.email;
    const transporter = getEmailTransporter();
    if (!emailConfig.enabled || !transporter)
        return false;
    await transporter.sendMail({
        from: emailConfig.from,
        to: emailConfig.to.join(','),
        subject,
        text,
    });
    return true;
};
const notifyBlockAlert = async (pool, alertId, options = {}) => {
    if (!alertId || typeof alertId !== 'string' || alertId.trim().length === 0) {
        logger.warn('alert_invalid_id', { alert_id: alertId });
        return;
    }
    if (config_1.config.queues.opsAlerts.mode === 'queue' && !options.force) {
        logger.info('alert_queue_mode_skip', { alert_id: alertId });
        return;
    }
    let event;
    try {
        event = await loadOpsAlertEvent(pool, alertId);
    }
    catch (error) {
        const { message, stack } = (0, error_handling_1.formatError)(error);
        logger.error('alert_load_failed', {
            alert_id: alertId,
            error: message,
            stack,
        });
        return;
    }
    if (!event) {
        logger.warn('alert_missing', { alert_id: alertId });
        return;
    }
    const payload = normalizePayload(event.payload);
    const slackConfigured = Boolean(config_1.config.alerts.slackWebhookUrl);
    const emailConfigured = Boolean(getEmailTransporter());
    if (!slackConfigured && !emailConfigured) {
        logger.info('alert_log_only', {
            alert_id: event.alert_id,
            provider_id: event.provider_id,
            corridor_id: event.corridor_id,
            http_status: event.http_status,
            reason: event.block_reason,
        });
        return;
    }
    const text = buildAlertText(event, payload);
    const subject = `Block alert: ${event.provider_id ?? 'unknown'} (${event.http_status ?? 'n/a'})`;
    const results = {
        slack: 'skipped', // Will be updated to 'sent' or 'failed' if slackConfigured is true
        email: 'skipped', // Will be updated to 'sent' or 'failed' if emailConfigured is true
    };
    if (slackConfigured) {
        try {
            await sendSlackAlert(text);
            results.slack = 'sent';
        }
        catch (error) {
            results.slack = 'failed';
            const { message, stack } = (0, error_handling_1.formatError)(error);
            logger.error('alert_slack_failed', {
                alert_id: event.alert_id,
                error: message,
                stack,
            });
        }
    }
    if (emailConfigured) {
        try {
            await sendEmailAlert(subject, text);
            results.email = 'sent';
        }
        catch (error) {
            results.email = 'failed';
            const { message, stack } = (0, error_handling_1.formatError)(error);
            logger.error('alert_email_failed', {
                alert_id: event.alert_id,
                error: message,
                stack,
            });
        }
    }
    logger.info('alert_routed', {
        alert_id: event.alert_id,
        provider_id: event.provider_id,
        corridor_id: event.corridor_id,
        http_status: event.http_status,
        reason: event.block_reason,
        slack: results.slack,
        email: results.email,
    });
};
exports.notifyBlockAlert = notifyBlockAlert;
