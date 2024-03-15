import { createEmail, emailList, sendEmail, SendEmailFunction } from '$lib/preview';
import { Resend } from 'resend';

export async function load() {
  return emailList({ path: '/src/emails' })
}

const send: typeof SendEmailFunction = async ({ from, to, subject, html }) => {
  const resend = new Resend('PRIVATE_RESEND_API_KEY');
  const sent = await resend.emails.send({ from, to, subject, html });

  if (sent.error) {
    return { success: false, error: sent.error }
  } else {
    return { success: true }
  }
}

export const actions = {
  ...createEmail,
  ...sendEmail({ resendApiKey: 'PRIVATE_RESEND_API_KEY' })
}
