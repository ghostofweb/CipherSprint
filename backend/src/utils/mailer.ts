// Outgoing email through Resend's HTTP API (no SDK needed). Without
// RESEND_API_KEY the message is printed to the server console instead, so
// password reset still works in development.

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail(mail: Mail): Promise<"sent" | "logged"> {
  if (!mailConfigured()) {
    console.log(`\n[mail] (no RESEND_API_KEY set, printing instead)\nTo: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return "logged";
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend rejected the email (${res.status}): ${detail.slice(0, 200)}`);
  }
  return "sent";
}
