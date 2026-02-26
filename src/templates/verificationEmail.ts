import { EmailTemplate, EmailVerificationTemplateData } from "../types";


export function createVerificationEmailTemplate(data: EmailVerificationTemplateData): EmailTemplate {
    const { firstName, verificationUrl, currentYear } = data;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email - Evently</title>
  <style>
    /* Reset */
    body, table, td, a { margin:0; padding:0; border:0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; line-height: 1.6; color: #1f2937; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    table { border-collapse: collapse !important; }
    .container { max-width: 580px; margin: 0 auto; }
    .content { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 30px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; font-weight: 700; margin: 0; }
    .body { padding: 40px 30px 30px; }
    .greeting { font-size: 22px; font-weight: 600; margin: 0 0 16px; color: #111827; }
    .text { font-size: 16px; margin: 0 0 24px; color: #4b5563; }
    .button-container { text-align: center; margin: 32px 0; }
    .button {
      display: inline-block;
      padding: 14px 36px;
      background: #3b82f6;
      color: white !important;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(59,130,246,0.3);
      transition: all 0.2s ease;
    }
    .button:hover { background: #2563eb; box-shadow: 0 10px 15px -3px rgba(59,130,246,0.4); }
    .link-fallback { font-size: 14px; color: #6b7280; word-break: break-all; margin: 20px 0; padding: 16px; background: #f1f5f9; border-radius: 8px; border: 1px solid #e5e7eb; }
    .expiry { font-size: 14px; color: #ef4444; font-weight: 500; margin: 24px 0 0; }
    .ignore { font-size: 14px; color: #6b7280; margin-top: 32px; }
    .footer { text-align: center; padding: 30px 20px; font-size: 13px; color: #9ca3af; }
    @media only screen and (max-width: 600px) {
      .body { padding: 30px 20px 20px !important; }
      .header { padding: 30px 20px 25px !important; }
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
                    <h1>Verify Your Email</h1>
                  </td>
                </tr>
              </table>

              <!-- Body -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" class="body">
  <tr>
    <td style="padding: 32px;">
      <h2 class="greeting">Hello ${firstName || 'there'}!</h2>
      <p class="text">
        Thank you for signing up with <strong>Evently</strong>. We're excited to have you on board!
      </p>
      <p class="text">
        Please confirm your email address by clicking the button below:
      </p>

      <div class="button-container">
        <a href="${verificationUrl}" class="button" target="_blank" rel="noopener noreferrer">
          Verify Email Address
        </a>
      </div>

      <p class="text" style="margin-bottom:12px;">
        Or copy and paste this link into your browser:
      </p>
      <div class="link-fallback">
        ${verificationUrl}
      </div>

      <p class="expiry">
        <strong>This link expires in 24 hours for security reasons.</strong>
      </p>

      <p class="ignore">
        If you didn't create an account with Evently, you can safely ignore this email.
      </p>
    </td>
  </tr>
</table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px; margin-top:30px;">
          <tr>
            <td class="footer">
              <p>© ${currentYear} Evently. All rights reserved.</p>
              <p style="margin-top:8px;">
                Kathmandu, Nepal
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const text = `
Hello ${firstName || 'there'}!

Thank you for joining Evently 🎉

Just one quick step left — please verify your email so you can start creating and managing events.

Verify your email:
${verificationUrl}

(If the button doesn't work, copy and paste the link above into your browser.)

This link will expire in 24 hours.

Didn't create an account? No worries — just ignore this message.

Questions? Reply to this email or reach us at help@evently.com.

Cheers,
The Evently Team

—
Evently • Kathmandu, Nepal
© ${currentYear} Evently — All rights reserved.
`.trim();

    return { html, text };
}