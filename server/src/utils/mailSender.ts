import nodemailer from 'nodemailer';

interface MailOptions {
  email: string;
  title: string;
  body: string;
}

export const mailSender = async ({ email, title, body }: MailOptions) => {
  try {
    // Create a Transporter to send emails
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      }
    });

    // Send emails to users
    const info = await transporter.sendMail({
      from: 'StudentGuideAI - Educational Assistant',
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email info: ", info);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}; 