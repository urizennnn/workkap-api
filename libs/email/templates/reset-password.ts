import { renderTemplate } from './template-utils';

export function resetPasswordTemplate(code: string): string {
  return renderTemplate('resetpasswordotp.html', { CODE: code });
}
