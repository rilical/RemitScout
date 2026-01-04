# Contact Form AWS Setup

This document describes how to configure the contact form for AWS deployment.

## Overview

The contact form (`/api/contact`) is a POST endpoint that:
1. Validates form data
2. Stores submissions in the database (`silver.contact_submissions` table)
3. Sends email notifications via AWS SES
4. Records CloudWatch metrics

## Database Setup

### Migration

Run the database migration to create the contact submissions table:

```bash
# The migration file is: backend/db/migrations/017_contact_submissions.sql
# It will be applied automatically when running migrations
```

The table includes:
- Submission data (name, email, subject, message)
- Timestamps (created_at, processed_at)
- Email delivery status (email_sent, email_error)

### Permissions

The `plane_a` role has INSERT and SELECT permissions on `silver.contact_submissions`.

## AWS SES Configuration

### Prerequisites

1. **SES Domain/Email Verification**: Verify your sending domain or email address in SES
2. **SES Region**: Configure the region where SES is set up
3. **IAM Permissions**: Lambda function needs `ses:SendEmail` permission

### Environment Variables

Set these environment variables in your Lambda function or ECS task:

```bash
# Enable contact form email notifications
CONTACT_EMAIL_ENABLED=1

# Recipient email address (where contact form submissions are sent)
CONTACT_EMAIL_TO=support@remitscout.com

# Sender email address (must be verified in SES)
CONTACT_EMAIL_FROM=noreply@remitscout.com

# Optional: Sender display name
CONTACT_EMAIL_FROM_NAME="Remit-Scout Contact Form"

# Optional: SES region (defaults to AWS_REGION or us-east-1)
SES_REGION=us-east-1
```

### IAM Permissions

Add this policy to your Lambda execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

Or for a specific verified email/domain:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "arn:aws:ses:us-east-1:ACCOUNT_ID:identity/noreply@remitscout.com"
    }
  ]
}
```

## API Gateway Configuration

### Rate Limiting

Configure rate limiting in API Gateway to prevent abuse:

```bash
# In CDK, set throttle rates for the contact endpoint
# Example: 10 requests per minute per IP
```

Or use API Gateway throttling:
- **Rate**: 10 requests per second (burst: 20)
- **Quota**: 1000 requests per day

### CORS

Ensure CORS is configured for the contact endpoint if called from the frontend.

## CloudWatch Metrics

The contact form automatically records:
- `http_requests_total` - Total requests with method, route, status_code
- `http_request_duration_seconds` - Request duration histogram

Metrics are sent to CloudWatch with dimensions:
- `method`: POST
- `route`: /contact
- `status_code`: 200, 400, 500

## Error Handling

### Graceful Degradation

The contact form is designed to work even if:
- Database table doesn't exist (logs warning, continues)
- SES is not configured (logs debug, continues)
- Email sending fails (logs error, but request succeeds)

This ensures users always get a success response even if backend services have issues.

### Error Responses

- **400 Bad Request**: Validation errors (invalid email, missing fields, etc.)
- **500 Internal Server Error**: Unexpected server errors

## Security Considerations

### XSS Prevention

- All user input is HTML-escaped before being included in email HTML
- Form validation prevents malicious input

### Rate Limiting

- API Gateway throttling prevents abuse
- Consider adding per-IP rate limiting in Redis

### Input Validation

- Name: 1-200 characters
- Email: Valid email format, max 200 characters
- Subject: 1-200 characters
- Message: 10-5000 characters

### Database

- Uses parameterized queries (prevents SQL injection)
- Stores submissions in `silver` schema (separate from sensitive data)

## Testing

### Local Testing

```bash
# Test without SES (will log warning but succeed)
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message"
  }'
```

### AWS Testing

1. Verify SES email/domain is verified
2. Set environment variables in Lambda/ECS
3. Test the endpoint via API Gateway
4. Check CloudWatch Logs for email delivery status
5. Verify email is received

## Monitoring

### CloudWatch Alarms

Consider creating alarms for:
- High error rate on `/contact` endpoint
- High latency on contact form submissions
- SES bounce/complaint rates

### Logs

Check CloudWatch Logs for:
- `contact_form_submission` - Successful submissions
- `contact_email_sent` - Email delivery success
- `contact_email_send_failed` - Email delivery failures
- `contact_form_error` - Form submission errors

## Troubleshooting

### Email Not Sending

1. Check `CONTACT_EMAIL_ENABLED=1` is set
2. Verify `CONTACT_EMAIL_TO` and `CONTACT_EMAIL_FROM` are set
3. Check SES email/domain is verified
4. Verify IAM permissions for SES
5. Check CloudWatch Logs for error messages

### Database Errors

1. Verify migration `017_contact_submissions.sql` has been applied
2. Check `plane_a` role has INSERT permission
3. Verify database connection is working

### High Latency

1. Check SES region matches Lambda region (for lower latency)
2. Consider using SQS for async email processing (future enhancement)
3. Monitor CloudWatch metrics for duration

## Future Enhancements

1. **SQS Queue**: Queue email sending for async processing
2. **Spam Detection**: Add basic spam filtering
3. **Rate Limiting**: Per-email rate limiting to prevent abuse
4. **Auto-Reply**: Send auto-reply confirmation to user
5. **Webhook Support**: Send webhook notifications for integrations


