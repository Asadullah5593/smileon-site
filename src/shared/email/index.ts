import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/shared/config/env";

export type Mail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

let transporter: Transporter | null = null;

function getTransporter() {
  if (!env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
  return transporter;
}

/**
 * Send mail, or log it when SMTP isn't configured. Development stays usable
 * without credentials, and a missing mail server never fails a user's booking.
 */
export async function sendMail(mail: Mail): Promise<{ delivered: boolean }> {
  const transport = getTransporter();

  if (!transport) {
    console.info(`[mail] (not sent — SMTP_HOST unset) to=${mail.to} subject=${mail.subject}`);
    return { delivered: false };
  }

  try {
    await transport.sendMail({ from: env.MAIL_FROM, ...mail });
    return { delivered: true };
  } catch (error) {
    console.error("[mail] delivery failed", error);
    return { delivered: false };
  }
}

/** Address that receives appointment/contact notifications. */
export function clinicInbox() {
  return env.MAIL_TO ?? null;
}
