import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
} from '@aws-sdk/client-sqs'

const mockSend = vi.fn()

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SendMessageCommand: vi.fn().mockImplementation((input) => ({ input })),
  ReceiveMessageCommand: vi.fn().mockImplementation((input) => ({ input })),
  DeleteMessageBatchCommand: vi.fn().mockImplementation((input) => ({ input })),
  GetQueueAttributesCommand: vi.fn().mockImplementation((input) => ({ input })),
}))

vi.mock('../shared/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

describe('sqs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSend.mockClear()
  })

  describe('sendJsonMessage', () => {
    it('sends message successfully', async () => {
      const { sendJsonMessage } = await import('../shared/sqs')
      mockSend.mockResolvedValue({})

      await sendJsonMessage('https://queue.amazonaws.com/test', { key: 'value' })

      expect(mockSend).toHaveBeenCalled()
      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: 'https://queue.amazonaws.com/test',
        MessageBody: JSON.stringify({ key: 'value' }),
      })
    })

    it('handles send errors', async () => {
      const { sendJsonMessage } = await import('../shared/sqs')
      const error = new Error('Send failed')
      mockSend.mockRejectedValue(error)

      await expect(
        sendJsonMessage('https://queue.amazonaws.com/test', { key: 'value' }),
      ).rejects.toThrow('Send failed')
    })

    it('serializes complex objects', async () => {
      const { sendJsonMessage } = await import('../shared/sqs')
      mockSend.mockResolvedValue({})

      const payload = {
        nested: { data: [1, 2, 3] },
        timestamp: new Date('2024-01-01').toISOString(),
      }

      await sendJsonMessage('https://queue.amazonaws.com/test', payload)

      expect(SendMessageCommand).toHaveBeenCalledWith({
        QueueUrl: 'https://queue.amazonaws.com/test',
        MessageBody: JSON.stringify(payload),
      })
    })
  })

  describe('receiveJsonMessages', () => {
    it('receives and parses messages', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      const mockMessages = [
        {
          MessageId: 'msg1',
          ReceiptHandle: 'handle1',
          Body: JSON.stringify({ key: 'value1' }),
          Attributes: { SentTimestamp: '1234567890' },
        },
        {
          MessageId: 'msg2',
          ReceiptHandle: 'handle2',
          Body: JSON.stringify({ key: 'value2' }),
          Attributes: {},
        },
      ]

      mockSend.mockResolvedValue({ Messages: mockMessages })

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(2)
      expect(messages[0].messageId).toBe('msg1')
      expect(messages[0].receiptHandle).toBe('handle1')
      expect(messages[0].payload).toEqual({ key: 'value1' })
      expect(messages[0].attributes).toEqual({ SentTimestamp: '1234567890' })
      expect(messages[1].payload).toEqual({ key: 'value2' })
    })

    it('handles empty message list', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      mockSend.mockResolvedValue({ Messages: [] })

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(0)
    })

    it('handles missing Messages in response', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      mockSend.mockResolvedValue({})

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(0)
    })

    it('caps maxMessages at 10', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      mockSend.mockResolvedValue({ Messages: [] })

      await receiveJsonMessages('https://queue.amazonaws.com/test', 20)

      expect(ReceiveMessageCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          MaxNumberOfMessages: 10,
        }),
      )
    })

    it('handles invalid JSON in message body', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      const mockMessages = [
        {
          MessageId: 'msg1',
          ReceiptHandle: 'handle1',
          Body: 'invalid json',
          Attributes: {},
        },
      ]

      mockSend.mockResolvedValue({ Messages: mockMessages })

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(1)
      expect(messages[0].payload).toBeNull()
    })

    it('handles missing message body', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      const mockMessages = [
        {
          MessageId: 'msg1',
          ReceiptHandle: 'handle1',
          Body: undefined,
          Attributes: {},
        },
      ]

      mockSend.mockResolvedValue({ Messages: mockMessages })

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(1)
      expect(messages[0].payload).toBeNull()
    })

    it('handles receive errors gracefully', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      mockSend.mockRejectedValue(new Error('Receive failed'))

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(0)
    })

    it('handles missing message fields', async () => {
      const { receiveJsonMessages } = await import('../shared/sqs')
      const mockMessages = [
        {
          MessageId: undefined,
          ReceiptHandle: undefined,
          Body: JSON.stringify({ key: 'value' }),
          Attributes: undefined,
        },
      ]

      mockSend.mockResolvedValue({ Messages: mockMessages })

      const messages = await receiveJsonMessages('https://queue.amazonaws.com/test', 5)

      expect(messages).toHaveLength(1)
      expect(messages[0].messageId).toBe('')
      expect(messages[0].receiptHandle).toBe('')
      expect(messages[0].attributes).toEqual({})
    })
  })

  describe('deleteMessages', () => {
    it('deletes messages successfully', async () => {
      const { deleteMessages } = await import('../shared/sqs')
      mockSend.mockResolvedValue({})

      await deleteMessages('https://queue.amazonaws.com/test', ['handle1', 'handle2'])

      expect(DeleteMessageBatchCommand).toHaveBeenCalledWith({
        QueueUrl: 'https://queue.amazonaws.com/test',
        Entries: [
          { Id: '0', ReceiptHandle: 'handle1' },
          { Id: '1', ReceiptHandle: 'handle2' },
        ],
      })
    })

    it('skips deletion when receiptHandles is empty', async () => {
      const { deleteMessages } = await import('../shared/sqs')
      await deleteMessages('https://queue.amazonaws.com/test', [])

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('handles delete errors gracefully', async () => {
      const { deleteMessages } = await import('../shared/sqs')
      mockSend.mockRejectedValue(new Error('Delete failed'))

      await expect(
        deleteMessages('https://queue.amazonaws.com/test', ['handle1']),
      ).resolves.not.toThrow()
    })
  })

  describe('getQueueDepth', () => {
    it('returns queue depth', async () => {
      const { getQueueDepth } = await import('../shared/sqs')
      mockSend.mockResolvedValue({
        Attributes: {
          ApproximateNumberOfMessages: '42',
        },
      })

      const depth = await getQueueDepth('https://queue.amazonaws.com/test')

      expect(depth).toBe(42)
      expect(GetQueueAttributesCommand).toHaveBeenCalledWith({
        QueueUrl: 'https://queue.amazonaws.com/test',
        AttributeNames: ['ApproximateNumberOfMessages'],
      })
    })

    it('returns 0 when attribute is missing', async () => {
      const { getQueueDepth } = await import('../shared/sqs')
      mockSend.mockResolvedValue({
        Attributes: {},
      })

      const depth = await getQueueDepth('https://queue.amazonaws.com/test')

      expect(depth).toBe(0)
    })

    it('returns 0 when Attributes is missing', async () => {
      const { getQueueDepth } = await import('../shared/sqs')
      mockSend.mockResolvedValue({})

      const depth = await getQueueDepth('https://queue.amazonaws.com/test')

      expect(depth).toBe(0)
    })

    it('handles errors gracefully', async () => {
      const { getQueueDepth } = await import('../shared/sqs')
      mockSend.mockRejectedValue(new Error('Depth failed'))

      const depth = await getQueueDepth('https://queue.amazonaws.com/test')

      expect(depth).toBe(0)
    })

    it('converts string count to number', async () => {
      const { getQueueDepth } = await import('../shared/sqs')
      mockSend.mockResolvedValue({
        Attributes: {
          ApproximateNumberOfMessages: '100',
        },
      })

      const depth = await getQueueDepth('https://queue.amazonaws.com/test')

      expect(depth).toBe(100)
      expect(typeof depth).toBe('number')
    })
  })
})
