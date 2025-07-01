import { renderTemplate } from './template-utils';

export function registrationSuccessTemplate(name: string): string {
  return renderTemplate('registrationsuccess.html', { NAME: name });
}
