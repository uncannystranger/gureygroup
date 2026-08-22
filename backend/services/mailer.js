import './../config/env.js';

/**
 * Outbound email.
 *
 * SMTP is optional: when SMTP_URL is configured the message is delivered
 * through it, otherwise the message is written to the server log so the flow
 * remains fully exercisable in development. The transport is resolved lazily so
 * the app does not require nodemailer unless SMTP is actually configured.
 */
const isSmtpConfigured = () => Boolean(process.env.SMTP_URL);

export const getMailerStatus = () => ({
  configured: isSmtpConfigured(),
  transport: isSmtpConfigured() ? 'smtp' : 'log',
  from: process.env.MAIL_FROM || 'Gurey Group <no-reply@gureygroup.local>',
});

let cachedTransport = null;

const getTransport = async () => {
  if (!isSmtpConfigured()) return null;
  if (cachedTransport) return cachedTransport;
  try {
    const { default: nodemailer } = await import('nodemailer');
    cachedTransport = nodemailer.createTransport(process.env.SMTP_URL);
    return cachedTransport;
  } catch (error) {
    console.error('[Mailer] SMTP_URL is set but nodemailer is unavailable:', error.message);
    return null;
  }
};

/**
 * @returns {Promise<{delivered: boolean, transport: 'smtp'|'log'}>}
 */
export const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.MAIL_FROM || 'Gurey Group <no-reply@gureygroup.local>';
  const transport = await getTransport();

  if (!transport) {
    // Never log the raw message body in production — it carries the token.
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[Mailer] SMTP is not configured; "${subject}" for ${to} was not delivered.`);
    } else {
      console.log(`\n[Mailer:log] To: ${to}\n[Mailer:log] Subject: ${subject}\n[Mailer:log] ${text}\n`);
    }
    return { delivered: false, transport: 'log' };
  }

  await transport.sendMail({ from, to, subject, text, html });
  return { delivered: true, transport: 'smtp' };
};
