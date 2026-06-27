const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`\n[EMAIL] To: ${to}\n[EMAIL] Subject: ${subject}\n[EMAIL] Body: ${text}\n`);
    return;
  }
  const from = process.env.EMAIL_FROM || `"Support Desk" <${process.env.EMAIL_USER}>`;
  await transporter.sendMail({ from, to, subject, html, text });
}

async function sendConfirmationEmail(ticket) {
  const subject = `[${ticket.ticket_number}] Ticket Received — ${ticket.title}`;
  const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f2f5;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <tr><td style="background:#1e3a5f;padding:24px 32px;">
    <h2 style="margin:0;color:#fff;font-size:20px;">Ticket Received</h2>
    <p style="margin:4px 0 0;color:#a8c4e0;font-size:13px;">Support Desk Ticketing System</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="margin:0 0 16px;color:#2c3e50;">Dear <strong>${ticket.requester_name}</strong>,</p>
    <p style="margin:0 0 20px;color:#2c3e50;">Your support request has been received and assigned the following ticket number:</p>
    <div style="background:#f0f2f5;border-left:4px solid #1e3a5f;padding:16px 20px;border-radius:4px;margin-bottom:24px;">
      <span style="font-size:22px;font-weight:700;color:#1e3a5f;letter-spacing:1px;">${ticket.ticket_number}</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dce1e7;border-radius:6px;overflow:hidden;font-size:14px;">
      <tr style="background:#f8f9fb;"><td style="padding:10px 16px;color:#7f8c8d;width:140px;"><strong>Subject</strong></td><td style="padding:10px 16px;color:#2c3e50;">${ticket.title}</td></tr>
      <tr><td style="padding:10px 16px;color:#7f8c8d;"><strong>Priority</strong></td><td style="padding:10px 16px;color:#2c3e50;text-transform:capitalize;">${ticket.priority}</td></tr>
      <tr style="background:#f8f9fb;"><td style="padding:10px 16px;color:#7f8c8d;"><strong>Category</strong></td><td style="padding:10px 16px;color:#2c3e50;">${ticket.category || 'General'}</td></tr>
      <tr><td style="padding:10px 16px;color:#7f8c8d;"><strong>Date</strong></td><td style="padding:10px 16px;color:#2c3e50;">${new Date(ticket.created_at).toLocaleString()}</td></tr>
      <tr style="background:#f8f9fb;"><td style="padding:10px 16px;color:#7f8c8d;"><strong>Status</strong></td><td style="padding:10px 16px;"><span style="background:#dbeafe;color:#1d4ed8;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">NEW</span></td></tr>
    </table>
    <p style="margin:24px 0 0;color:#2c3e50;">Please keep your ticket number for reference. Our support team will review your request and respond as soon as possible.</p>
    <p style="margin:16px 0 0;color:#7f8c8d;font-size:13px;">Thank you,<br><strong>Support Desk Team</strong></p>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #dce1e7;font-size:12px;color:#7f8c8d;text-align:center;">
    This is an automated message from the Support Desk Ticketing System.
  </td></tr>
</table></td></tr></table>
</body></html>`;

  const text = `Ticket Received\n\nDear ${ticket.requester_name},\n\nYour ticket has been received.\n\nTicket Number: ${ticket.ticket_number}\nSubject: ${ticket.title}\nPriority: ${ticket.priority}\nStatus: New\nDate: ${new Date(ticket.created_at).toLocaleString()}\n\nPlease keep this number for reference.\n\nThank you,\nSupport Desk Team`;

  await sendEmail({ to: ticket.requester_email, subject, html, text });
}

async function sendResponseEmail({ to, subject, body, ticket }) {
  const fullSubject = subject.includes(ticket.ticket_number) ? subject : `[${ticket.ticket_number}] ${subject}`;
  const escapedBody = body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  const html = `
<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f0f2f5;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1);">
  <tr><td style="background:#1e3a5f;padding:24px 32px;">
    <h2 style="margin:0;color:#fff;font-size:20px;">Support Response</h2>
    <p style="margin:4px 0 0;color:#a8c4e0;font-size:13px;">Ref: ${ticket.ticket_number} — ${ticket.title}</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <div style="color:#2c3e50;line-height:1.6;">${escapedBody}</div>
    <hr style="border:none;border-top:1px solid #dce1e7;margin:24px 0;">
    <p style="margin:0;color:#7f8c8d;font-size:12px;">Ticket Reference: ${ticket.ticket_number} | ${ticket.title}</p>
  </td></tr>
  <tr><td style="background:#f8f9fb;padding:16px 32px;border-top:1px solid #dce1e7;font-size:12px;color:#7f8c8d;text-align:center;">
    This message was sent from the Support Desk Ticketing System.
  </td></tr>
</table></td></tr></table>
</body></html>`;

  await sendEmail({ to, subject: fullSubject, html, text: body });
}

module.exports = { sendConfirmationEmail, sendResponseEmail };
