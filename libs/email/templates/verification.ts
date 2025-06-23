export function verificationTemplate(code: string): string {
  return `\n  <div style="font-family:Arial,sans-serif">
    <h3>Verify your email</h3>
    <p>Your verification code is <strong>${code}</strong></p>
  </div>
  `;
}
