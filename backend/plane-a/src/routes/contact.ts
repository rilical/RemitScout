import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { getPool } from '../../../shared/db'
import { config } from '../../../shared/config'
import { createLogger } from '../../../shared/logger'
import { recordRequest } from '../../../shared/api-metrics'
import { formatError } from '../../../shared/utils/error-handling'

const logger = createLogger('plane-a.contact')

const contactFormSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
})

// AWS SES client (lazy initialization)
let sesClient: SESClient | null = null

const getSesClient = (): SESClient | null => {
  const sesRegion = process.env.SES_REGION || process.env.AWS_REGION || 'us-east-1'
  const contactEmailEnabled = process.env.CONTACT_EMAIL_ENABLED === '1' || process.env.CONTACT_EMAIL_ENABLED === 'true'
  const contactEmailTo = process.env.CONTACT_EMAIL_TO
  const contactEmailFrom = process.env.CONTACT_EMAIL_FROM || process.env.SES_FROM_ADDRESS

  if (!contactEmailEnabled || !contactEmailTo || !contactEmailFrom) {
    logger.debug('contact_email_not_configured', {
      enabled: contactEmailEnabled,
      has_to: !!contactEmailTo,
      has_from: !!contactEmailFrom,
    })
    return null
  }

  if (!sesClient) {
    sesClient = new SESClient({ region: sesRegion })
  }

  return sesClient
}

// HTML escape function for XSS prevention
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

const sendContactEmail = async (
  name: string,
  email: string,
  subject: string,
  message: string,
): Promise<{ success: boolean; error?: string }> => {
  const client = getSesClient()
  if (!client) {
    return { success: false, error: 'email_not_configured' }
  }

  const contactEmailTo = process.env.CONTACT_EMAIL_TO!
  const contactEmailFrom = process.env.CONTACT_EMAIL_FROM || process.env.SES_FROM_ADDRESS || 'noreply@remitscout.com'
  const contactEmailFromName = process.env.CONTACT_EMAIL_FROM_NAME || 'Remit-Scout Contact Form'

  // Escape HTML for XSS prevention
  const escapedName = escapeHtml(name)
  const escapedEmail = escapeHtml(email)
  const escapedSubject = escapeHtml(subject)
  const escapedMessage = escapeHtml(message)

  const emailSubject = `[Contact Form] ${subject}`
  const emailBody = `
New contact form submission from Remit-Scout:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
This message was sent from the Remit-Scout contact form.
  `.trim()

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #555; }
    .message { background-color: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="field">
      <div class="label">Name:</div>
      <div>${escapedName}</div>
    </div>
    <div class="field">
      <div class="label">Email:</div>
      <div><a href="mailto:${escapedEmail}">${escapedEmail}</a></div>
    </div>
    <div class="field">
      <div class="label">Subject:</div>
      <div>${escapedSubject}</div>
    </div>
    <div class="field">
      <div class="label">Message:</div>
      <div class="message">${escapedMessage}</div>
    </div>
    <div class="footer">
      This message was sent from the Remit-Scout contact form.
    </div>
  </div>
</body>
</html>
  `.trim()

  try {
    await client.send(
      new SendEmailCommand({
        Source: `${contactEmailFromName} <${contactEmailFrom}>`,
        Destination: {
          ToAddresses: [contactEmailTo],
        },
        Message: {
          Subject: {
            Data: emailSubject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: {
              Data: emailBody,
              Charset: 'UTF-8',
            },
            Html: {
              Data: emailHtml,
              Charset: 'UTF-8',
            },
          },
        },
        ReplyToAddresses: [email],
      }),
    )

    logger.info('contact_email_sent', {
      to: contactEmailTo,
      from_email: email,
      subject,
    })

    return { success: true }
  } catch (error: unknown) {
    const { message } = formatError(error)
    logger.error('contact_email_send_failed', {
      to: contactEmailTo,
      error: message,
    })
    return { success: false, error: message }
  }
}

export const contactRoutes = async (app: FastifyInstance) => {
  app.post('/contact', async (request, reply) => {
    const startTime = Date.now()
    let statusCode = 200

    try {
      const body = contactFormSchema.parse(request.body)

      // Log the contact form submission
      logger.info('contact_form_submission', {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message_length: body.message.length,
      })

      // Store in database (silver schema for Plane A)
      const pool = getPool(config.db.planeAUrl)
      let submissionId: number | null = null
      let emailSent = false
      let emailError: string | null = null

      try {
        const result = await pool.query(
          `INSERT INTO silver.contact_submissions (name, email, subject, message, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING id`,
          [body.name, body.email, body.subject, body.message],
        )
        submissionId = result.rows[0]?.id || null
        logger.debug('contact_submission_stored', { submission_id: submissionId })
      } catch (dbError) {
        // If table doesn't exist, log but don't fail
        logger.warn('contact_form_db_insert_failed', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
        })
      }

      // Send email notification via AWS SES (non-blocking)
      // Don't fail the request if email fails
      try {
        const emailResult = await sendContactEmail(
          body.name,
          body.email,
          body.subject,
          body.message,
        )
        emailSent = emailResult.success
        emailError = emailResult.error || null

        // Update database with email status if we have a submission ID
        if (submissionId && pool) {
          try {
            await pool.query(
              `UPDATE silver.contact_submissions
               SET email_sent = $1, email_error = $2, processed_at = NOW()
               WHERE id = $3`,
              [emailSent, emailError, submissionId],
            )
          } catch (updateError) {
            // Log but don't fail
            logger.warn('contact_email_status_update_failed', {
              error: updateError instanceof Error ? updateError.message : String(updateError),
            })
          }
        }
      } catch (emailError) {
        logger.warn('contact_email_error', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
        })
        // Continue - don't fail the request if email fails
      }

      // Record API metrics
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/contact', 200, durationSeconds)

      return {
        success: true,
        message: 'Thank you for contacting us. We will get back to you soon.',
      }
    } catch (error) {
      statusCode = error instanceof z.ZodError ? 400 : 500
      const durationSeconds = (Date.now() - startTime) / 1000
      recordRequest('POST', '/contact', statusCode, durationSeconds)

      if (error instanceof z.ZodError) {
        reply.code(400)
        return {
          success: false,
          error: 'validation_error',
          message: 'Invalid form data. Please check your input.',
          details: error.errors,
        }
      }

      logger.error('contact_form_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      reply.code(500)
      return {
        success: false,
        error: 'internal_error',
        message: 'An error occurred while submitting your message. Please try again later.',
      }
    }
  })
}

