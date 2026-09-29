import nodemailer from "nodemailer";

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  attachment?: { filename: string; base64: string };
}

/**
 * Envia un correo via SMTP. Si las variables SMTP_* no estan configuradas en
 * .env.local, devuelve un error explicativo en vez de lanzar una excepcion,
 * siguiendo el mismo patron de degradacion controlada que el resto del
 * proyecto (ver lib/supabase/env.ts).
 */
export async function sendMail(input: SendMailInput): Promise<{ error: string | null }> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    return {
      error:
        "El envío por email no está configurado. Añade SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD y SMTP_FROM en .env.local.",
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      attachments: input.attachment
        ? [
            {
              filename: input.attachment.filename,
              content: input.attachment.base64,
              encoding: "base64",
            },
          ]
        : undefined,
    });
    return { error: null };
  } catch {
    return { error: "No se pudo enviar el email. Revisa la configuración SMTP." };
  }
}
