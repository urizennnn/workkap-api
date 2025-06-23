export function resetPasswordTemplate(code: string): string {
  return `\n  <div style="font-family:Arial,sans-serif">\n    <h3>Password Reset</h3>\n    <p>Use the code <strong>${code}</strong> to reset your password.</p>\n  </div>\n  `;
}
