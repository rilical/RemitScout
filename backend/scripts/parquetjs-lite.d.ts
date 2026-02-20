declare module 'parquetjs-lite' {
  export class ParquetSchema {
    constructor(schema: Record<string, { type: string; optional?: boolean }>)
  }

  export class ParquetWriter {
    static openStream(schema: ParquetSchema, stream: NodeJS.WritableStream): Promise<ParquetWriter>
    appendRow(row: Record<string, unknown>): Promise<void>
    close(): Promise<void>
  }
}
