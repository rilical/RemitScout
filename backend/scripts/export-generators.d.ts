export type CsvSection = {
    title: string;
    headers: string[];
    rows: Array<Record<string, unknown>>;
};
export declare const escapeCsv: (value: unknown) => string;
export declare const buildCsv: (headers: string[], rows: Array<Record<string, unknown>>) => string;
export declare const buildCsvSections: (sections: CsvSection[]) => string;
export declare const renderPdf: (title: string, sections: CsvSection[]) => Promise<Buffer>;
export declare const buildZip: (entries: Array<{
    name: string;
    content: Buffer | string;
}>, onWarning?: (warning: Error) => void) => Promise<Buffer>;
export type ParquetFieldType = 'UTF8' | 'DOUBLE' | 'INT32' | 'BOOLEAN';
export type ParquetFieldDefinition = {
    type: ParquetFieldType;
    optional?: boolean;
};
export type ParquetSchemaDefinition = Record<string, ParquetFieldDefinition>;
export declare const buildParquetBuffer: (schemaDefinition: ParquetSchemaDefinition, rows: Array<Record<string, unknown>>) => Promise<Buffer>;
