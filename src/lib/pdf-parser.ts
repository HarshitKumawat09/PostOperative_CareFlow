// PDF Parser Utility for Medical Guidelines
// Extracts clean text from PDF files for RAG processing

import { PDFParse } from 'pdf-parse';

export interface ParsedPDF {
  text: string;
  pages: number;
  info: any;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export async function parsePDF(buffer: ArrayBuffer | Buffer): Promise<ParsedPDF> {
  try {
    const pdfParser = new PDFParse({ data: buffer });
    const textResult = await pdfParser.getText();
    const infoResult = await pdfParser.getInfo();
    
    return {
      text: textResult.text,
      pages: textResult.pages.length,
      info: infoResult.info,
      metadata: {
        title: infoResult.info?.Title,
        author: infoResult.info?.Author,
        subject: infoResult.info?.Subject,
        creator: infoResult.info?.Creator,
        producer: infoResult.info?.Producer,
        creationDate: infoResult.info?.CreationDate ? new Date(infoResult.info.CreationDate) : undefined,
        modificationDate: infoResult.info?.ModDate ? new Date(infoResult.info.ModDate) : undefined,
      }
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function cleanExtractedText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s{2,}/g, ' ')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Remove page numbers (common patterns)
    .replace(/^\d+\s*$/gm, '')
    .replace(/^Page\s+\d+\s*$/gmi, '')
    .replace(/^\d+\s+of\s+\d+\s*$/gmi, '')
    // Remove headers/footers (short lines)
    .replace(/^.{0,50}(\r?\n){1,2}$/gm, '')
    // Remove PDF artifacts
    .replace(/\f/g, '\n') // Form feed characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    // Clean up spacing
    .trim();
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  
  if (fileType === 'application/pdf') {
    // Handle PDF files
    const buffer = await file.arrayBuffer();
    const parsed = await parsePDF(buffer);
    return cleanExtractedText(parsed.text);
  } else if (fileType === 'text/plain' || fileType === 'text/markdown') {
    // Handle text files
    const text = await file.text();
    return cleanExtractedText(text);
  } else {
    throw new Error(`Unsupported file type: ${fileType}. Please use PDF, TXT, or MD files.`);
  }
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function isTextFile(file: File): boolean {
  const textTypes = ['text/plain', 'text/markdown'];
  const textExtensions = ['.txt', '.md'];
  return textTypes.includes(file.type) || 
         textExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}
