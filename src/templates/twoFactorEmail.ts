import { EmailTemplate } from '../types';

export interface TwoFactorEmailTemplateData {
  firstName: string;
  code: string;
  currentYear: number;
}

export function createTwoFactorEmailTemplate(data: TwoFactorEmailTemplateData): EmailTemplate {
  const { firstName, code, currentYear } = data;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Login Verification Code - Evently</title>
  <style>
    body, table, td, a { margin:0; padding:0; border:0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; line-height: 1.6; color: #1f2937; }
    table { border-collapse: collapse !important; }
    .container { max-width: 580px; margin: 0 auto; }
    .content { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin: 0; }
    .header p { color: rgba(255,255,255,0.85); font-size: 15px; margin: 8px 0 0; }
    .body { padding: 40px 30px 30px; }
    .greeting { font-size: 22px; font-weight: 600; margin: 0 0 16px; color: #111827; }
    .text { font-size: 16px; margin: 0 0 24px; color: #4b5563; }
    .code-container { text-align: center; margin: 32px 0; padding: 32px 20px; background: #f1f5f9; border-radius: 12px; border: 2px dashed #cbd5e1; }
    .code { font-size: 48px; font-weight: 700; letter-spacing: 16px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace; display: block; }
    .code-label { font-size: 13px; color: #6b7280; margin-top: 12px; display: block; text-transform: uppercase; letter-spacing: 1px; }
    .expiry { font-size: 14px; color: #ef4444; font-weight: 500; text-align: center; margin: 0 0 24px; }
    .warning { font-size: 14px; color: #6b7280; padding: 16px; background: #fef9c3; border-radius: 8px; border: 1px solid #fde68a; margin: 24px 0 0; }
    .footer { text-align: center; padding: 30px 20px; font-size: 13px; color: #9ca3af; }
    @media only screen and (max-width: 600px) {
      .body { padding: 30px 20px 20px !important; }
      .header { padding: 30px 20px 25px !important; }
      .code { font-size: 36px !important; letter-spacing: 10px !important; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc; padding:40px 0;">
    <tr>
      <td align="center">
        <table class="container" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="content">

              <!-- Header -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="header">
                    <h1>🔐 Verification Code</h1>
                    <p>Two-Factor Authentication</p>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="body">
                    <p class="greeting">Hello, ${firstName}!</p>
                    <p class="text">
                      We received a login attempt for your account. Use the code below to complete your sign-in.
                    </p>

                    <!-- Code block -->
                    <div class="code-container">
                      <span class="code">${code}</span>
                      <span class="code-label">Your verification code</span>
                    </div>

                    <p class="expiry">⏱ This code expires in <strong>10 minutes</strong> and can only be used once.</p>

                    <div class="warning">
                      <strong>Didn't request this?</strong> If you didn't attempt to log in, please ignore this email and consider changing your password — someone may have your credentials.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="footer">
                    <p>© ${currentYear} Evently. All rights reserved.</p>
                    <p style="margin-top:8px;">This is an automated security email — please do not reply.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `Hello ${firstName},\n\nYour two-factor authentication code is: ${code}\n\nThis code expires in 10 minutes and can only be used once.\n\nIf you did not attempt to log in, please ignore this email and consider changing your password.\n\n© ${currentYear} Evently`;

  return { html, text };
}
