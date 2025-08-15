import { readFileSync } from 'fs';
import { join } from 'path';

export function renderTemplate(
  file: string,
  variables: Record<string, string>,
): string {
  try {
    const filePath = join(__dirname, file);
    let html = readFileSync(filePath, 'utf8');
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  } catch (error) {
    throw new Error(
      `Failed to load email template ${file}: ${(error as Error).message}`,
    );
  }
}
