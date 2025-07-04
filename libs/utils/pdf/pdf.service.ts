import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import type { Result } from 'pdf-parse';

@Injectable()
export class PdfService {
  async parse(path: string): Promise<string> {
    try {
      await fs.access(path);
    } catch {
      throw new Error(`File does not exist: ${path}`);
    }

    const buffer = await fs.readFile(path);
    const data: Result = await pdfParse(buffer);
    return data.text;
  }
}
