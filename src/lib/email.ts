import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Configure SMTP transporter using environment variables.
 * Supports Gmail directly or any custom SMTP server (Brevo, SendGrid, Mailgun, AWS SES, etc.).
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!user || !pass || user.trim() === '' || pass.trim() === '') {
    return null;
  }

  // If host is gmail or service is gmail
  if (host.includes('gmail') || process.env.SMTP_SERVICE?.toLowerCase() === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        // Strip any spaces if the user pasted a 16-character Google App Password with spaces
        pass: pass.trim().replace(/\s+/g, ''),
      },
    });
  }

  return nodemailer.createTransport({
    host: host.trim(),
    port,
    secure,
    auth: {
      user: user.trim(),
      pass: pass.trim(),
    },
  });
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      const err = 'SMTP email service is not configured. Please set your SMTP_USER and SMTP_PASS in the .env file to deliver real OTP emails to your inbox.';
      console.error(`[EMAIL CONFIG ERROR] ${err}`);
      return { success: false, error: err };
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || `"ReviewPulse AI" <noreply@reviewpulse.ai>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || subject,
      html,
    });

    console.log(`[EMAIL DISPATCHED] Real OTP email successfully sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    console.error('[SMTP ERROR] Failed to send email via SMTP:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to send verification email through SMTP.';
    return { success: false, error: `Email delivery failed: ${errorMsg}` };
  }
}

export async function sendPasswordResetOtpEmail(toEmail: string, otp: string) {
  const subject = `Your Password Reset OTP - ReviewPulse AI (${otp})`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f1f5f9; padding: 24px; }
          .card { max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #60a5fa; letter-spacing: -0.5px; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
          .subtitle { font-size: 14px; color: #94a3b8; line-height: 1.5; }
          .otp-box { background: linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(14, 165, 233, 0.15)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; }
          .validity { font-size: 12px; color: #cbd5e1; margin-top: 8px; }
          .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 28px; line-height: 1.4; border-top: 1px solid #1f2937; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">ReviewPulse AI</div>
            <div class="title">Password Reset Verification Code</div>
            <div class="subtitle">We received a request to reset your password. Use the verification code below to complete the process.</div>
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="validity">⏱️ This code will expire in <strong>10 minutes</strong>.</div>
          </div>
          <div class="subtitle" style="font-size: 13px;">
            If you did not request this password reset, please ignore this email or contact support. Your password will remain unchanged.
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} ReviewPulse AI Inc. All rights reserved.<br>
            Secure automated review growth platform.
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Your ReviewPulse AI Password Reset Code is: ${otp}\nThis code is valid for 10 minutes.\nIf you did not request this, please ignore this message.`;

  return sendEmail({
    to: toEmail,
    subject,
    html,
    text,
  });
}
