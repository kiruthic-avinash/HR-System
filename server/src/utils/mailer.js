const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

function getTransporter() {
  if (!transporter) {
    if (env.smtp.host) {
      transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.port === 465,
        auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
      });
    } else {
      // Dev fallback: no SMTP configured - emails are logged, not sent.
      transporter = nodemailer.createTransport({ jsonTransport: true });
    }
  }
  return transporter;
}

async function sendVerificationEmail(to, verifyUrl) {
  const info = await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject: 'Verify your HR System account',
    text: `Welcome to HR System!\n\nPlease verify your email by opening this link:\n${verifyUrl}\n\nThe link expires in 24 hours.`,
    html: `<p>Welcome to HR System!</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify my account</a></p><p>The link expires in 24 hours.</p>`,
  });
  if (!env.smtp.host) {
    console.log(`[mailer] Verification link for ${to}: ${verifyUrl}`);
  }
  return info;
}

module.exports = { sendVerificationEmail };
