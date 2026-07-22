import nodemailer from 'nodemailer';

/**
 * Pembaruan: Sekarang menggunakan SMTP (misal: Gmail, Hostinger, dll.)
 * Pastikan Anda sudah mengisi variabel berikut di .env:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return { success: false, error: 'SMTP Configuration missing' };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Arvela HR" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
