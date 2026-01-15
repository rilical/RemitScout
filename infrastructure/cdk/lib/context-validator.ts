import type { IConstruct } from 'constructs'
import * as fs from 'fs'
import * as path from 'path'

type ContextValue = string | number | boolean | string[] | undefined

type ContextSchema = {
  properties: Record<
    string,
    {
      type?: string
      enum?: string[]
      default?: ContextValue
      description?: string
    }
  >
  required?: string[]
}

const loadContextSchema = (): ContextSchema => {
  const schemaPath = path.join(__dirname, '..', 'cdk.context.schema.json')
  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf-8')
    return JSON.parse(schemaContent) as ContextSchema
  } catch (error) {
    console.warn('Warning: Could not load context schema, validation will be limited')
    return { properties: {}, required: [] }
  }
}

const contextSchema = loadContextSchema()

export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const validateContextValue = (
  key: string,
  value: ContextValue,
  schemaProperty: ContextSchema['properties'][string],
): string[] => {
  const errors: string[] = []

  if (schemaProperty.type === 'string' && typeof value !== 'string' && value !== undefined) {
    errors.push(`Context variable '${key}' must be a string, got ${typeof value}`)
  }

  if (schemaProperty.type === 'number' && typeof value !== 'number' && value !== undefined) {
    errors.push(`Context variable '${key}' must be a number, got ${typeof value}`)
  }

  if (schemaProperty.type === 'boolean' && typeof value !== 'boolean' && value !== undefined) {
    errors.push(`Context variable '${key}' must be a boolean, got ${typeof value}`)
  }

  if (schemaProperty.type === 'array' && !Array.isArray(value) && value !== undefined) {
    errors.push(`Context variable '${key}' must be an array, got ${typeof value}`)
  }

  if (
    schemaProperty.enum &&
    value !== undefined &&
    !schemaProperty.enum.includes(String(value))
  ) {
    errors.push(
      `Context variable '${key}' must be one of: ${schemaProperty.enum.join(', ')}, got ${value}`,
    )
  }

  return errors
}

export const validateContext = (
  construct: IConstruct,
  envName: string,
): ValidationResult => {
  const errors: string[] = []
  const warnings: string[] = []

  const required = contextSchema.required || []
  const properties = contextSchema.properties || {}

  for (const key of required) {
    const value = construct.node.tryGetContext(key)
    if (value === undefined) {
      errors.push(`Required context variable '${key}' is missing`)
    }
  }

  const allContext = construct.node.getAllContext() as Record<string, ContextValue>
  for (const [key, value] of Object.entries(allContext)) {
    if (key.startsWith('@')) {
      continue
    }

    const schemaProperty = properties[key]
    if (!schemaProperty) {
      warnings.push(`Unknown context variable '${key}' (not in schema)`)
      continue
    }

    const validationErrors = validateContextValue(key, value, schemaProperty)
    errors.push(...validationErrors)
  }

  if (envName === 'prod') {
    const prodRequired = [
      'planeADomainName',
      'planeACertificateArn',
      'planeAHostedZoneId',
      'planeAHostedZoneName',
    ]

    for (const key of prodRequired) {
      const value = construct.node.tryGetContext(key)
      if (value === undefined) {
        warnings.push(
          `Production environment should have '${key}' set for custom domain support`,
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

export const getContextWithDefaults = (
  construct: IConstruct,
): Record<string, ContextValue> => {
  const result: Record<string, ContextValue> = {}
  const properties = contextSchema.properties || {}

  for (const [key, schemaProperty] of Object.entries(properties)) {
    const value = construct.node.tryGetContext(key)
    if (value !== undefined) {
      result[key] = value
    } else if (schemaProperty.default !== undefined) {
      result[key] = schemaProperty.default
    }
  }

  return result
}
