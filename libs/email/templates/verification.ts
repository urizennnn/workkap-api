import { renderTemplate } from './template-utils';

export function verificationTemplate(code: string): string {
  return renderTemplate('emailverificationotp.html', { CODE: code });
}
