/**
 * Email Service Module
 * This module handles all email-related functionality using Nodemailer.
 * It provides a simple interface to send emails through Gmail SMTP.
 */

import nodemailer from 'nodemailer';

/**
 * Email transporter configuration
 * Uses Gmail SMTP service with authentication
 * Environment variables required:
 * - EMAIL_USER: Gmail account email address
 * - EMAIL_PASSWORD: Gmail app password (not regular password)
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

/**
 * Interface defining the structure of email data
 * @property {string} to - Recipient's email address
 * @property {string} subject - Email subject line
 * @property {string} text - Plain text version of the email
 * @property {string} [html] - Optional HTML version of the email
 */
export interface EmailData {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

/**
 * Sends an email using the configured transporter
 * @param {EmailData} emailData - Object containing email details
 * @returns {Promise<boolean>} - Returns true if email was sent successfully, false otherwise
 * @throws Will log error to console if email sending fails
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
    try {
        // Configure email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailData.to,
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}; 