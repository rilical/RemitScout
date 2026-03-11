import { describe, expect, it, vi } from 'vitest'

import {
  parseEcrImageReference,
  validateContainerImages,
} from '../scripts/ci/verify-ecs-task-images'

describe('verify ecs task images', () => {
  it('parses tagged ECR image references', () => {
    expect(
      parseEcrImageReference(
        '123456789012.dkr.ecr.us-east-1.amazonaws.com/remit-scout-backend-prod:v1.2.3',
      ),
    ).toEqual({
      registry: '123456789012.dkr.ecr.us-east-1.amazonaws.com',
      repositoryName: 'remit-scout-backend-prod',
      tag: 'v1.2.3',
      digest: undefined,
    })
  })

  it('rejects latest tags and missing ECR images', async () => {
    const imageExists = vi.fn(async (reference) => reference.tag === 'v1.2.3')

    const issues = await validateContainerImages(
      'prod',
      'arn:aws:ecs:us-east-1:123456789012:task-definition/remit-scout-prod:42',
      'plane-b-ingest',
      [
        {
          name: 'backend',
          image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/remit-scout-backend-prod:latest',
        },
        {
          name: 'worker',
          image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/remit-scout-backend-prod:v9.9.9',
        },
      ],
      imageExists,
    )

    expect(issues).toHaveLength(2)
    expect(issues[0]?.reason).toContain('latest tag')
    expect(issues[1]?.reason).toContain('does not exist in ECR')
  })
})
