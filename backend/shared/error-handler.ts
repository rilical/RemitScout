import { createLogger } from './logger'
import { captureExceptionWithContext, addBreadcrumb } from './error-tracker'

const logger = createLogger('shared.error-handler')

export const handleError = (
  error: Error,
  context: Record<string, unknown>,
  service?: string,
): void => {
  logger.error('error_handled', {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  })

  try {
    captureExceptionWithContext(error, context, {
      service: service || 'remit-scout',
    })
  } catch {
    // Silently ignore if Sentry capture fails
  }
}

export const handleErrorWithBreadcrumb = (
  error: Error,
  context: Record<string, unknown>,
  breadcrumbMessage: string,
  breadcrumbCategory: string,
  service?: string,
): void => {
  try {
    addBreadcrumb(breadcrumbMessage, breadcrumbCategory, 'error')
  } catch {
    // Silently ignore breadcrumb failures
  }

  handleError(error, context, service)
}

export const wrapAsync = <T>(
  fn: () => Promise<T>,
  context: Record<string, unknown>,
  service?: string,
): Promise<T> => {
  return fn().catch((error) => {
    if (error instanceof Error) {
      handleError(error, context, service)
    } else {
      handleError(new Error(String(error)), context, service)
    }
    throw error
  })
}




