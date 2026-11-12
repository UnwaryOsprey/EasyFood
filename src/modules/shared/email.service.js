// src/lib/email.service.js
// Serviço de envio de e-mails via MailerSend (ver ADR-006).
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

let client = null;

// Cliente criado sob demanda: garante que o dotenv já carregou o .env.
function getClient() {
  if (!process.env.MAILERSEND_API_KEY) {
    throw new Error('MAILERSEND_API_KEY não configurada');
  }
  if (!client) {
    client = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
  }
  return client;
}

// Aceita "noreply@dominio" ou apenas "dominio" (adiciona "noreply@").
function getFromAddress() {
  const from = process.env.EMAIL_FROM || '';
  return from.includes('@') ? from : `noreply@${from}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHtml({ header, body, footer }) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
    <div style="background:#8b6f47;color:#fff;padding:20px 24px;font-size:20px;font-weight:bold">${escapeHtml(header)}</div>
    <div style="padding:24px;color:#2c3e50;font-size:15px;line-height:1.6">${escapeHtml(body).replace(/\n/g, '<br>')}</div>
    <div style="background:#f5f5f5;color:#7f8c8d;padding:14px 24px;font-size:12px">${escapeHtml(footer)}</div>
  </div>`;
}

export async function sendEmail({ to, toName, subject, header, body, footer }) {
  const mailerSend = getClient();

  const params = new EmailParams()
    .setFrom(new Sender(getFromAddress(), process.env.EMAIL_FROM_NAME || 'EasyFood'))
    .setTo([new Recipient(to, toName)])
    .setSubject(subject)
    .setHtml(buildHtml({ header, body, footer }))
    .setText([header, body, footer].filter(Boolean).join('\n\n'));

  return mailerSend.email.send(params);
}