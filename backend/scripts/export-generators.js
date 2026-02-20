"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildZip = exports.renderPdf = exports.buildCsvSections = exports.buildCsv = exports.escapeCsv = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const archiver_1 = __importDefault(require("archiver"));
const escapeCsv = (value) => {
    if (value === null || value === undefined)
        return '';
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};
exports.escapeCsv = escapeCsv;
const buildCsv = (headers, rows) => {
    const lines = [headers.join(',')];
    for (const row of rows) {
        lines.push(headers.map((header) => (0, exports.escapeCsv)(row[header])).join(','));
    }
    return lines.join('\n');
};
exports.buildCsv = buildCsv;
const buildCsvSections = (sections) => {
    const lines = [];
    for (const section of sections) {
        lines.push(`SECTION:${section.title}`);
        lines.push((0, exports.buildCsv)(section.headers, section.rows));
        lines.push('');
    }
    return lines.join('\n');
};
exports.buildCsvSections = buildCsvSections;
const renderPdf = async (title, sections) => {
    return await new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: 40 });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.fontSize(18).text(title);
        doc.moveDown();
        for (const section of sections) {
            doc.fontSize(14).text(section.title);
            doc.moveDown(0.5);
            doc.fontSize(10).text(section.headers.join(' | '));
            doc.moveDown(0.25);
            for (const row of section.rows) {
                const line = section.headers.map((header) => String(row[header] ?? '')).join(' | ');
                doc.text(line);
            }
            doc.moveDown();
        }
        doc.end();
    });
};
exports.renderPdf = renderPdf;
const buildZip = async (entries, onWarning) => {
    return await new Promise((resolve, reject) => {
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        const chunks = [];
        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('warning', (warning) => {
            onWarning?.(warning);
        });
        archive.on('error', reject);
        archive.on('end', () => resolve(Buffer.concat(chunks)));
        for (const entry of entries) {
            archive.append(entry.content, { name: entry.name });
        }
        try {
            archive.finalize();
        }
        catch (error) {
            reject(error);
        }
    });
};
exports.buildZip = buildZip;
