import nodemailer from 'nodemailer';

/**
 * Pembaruan: Sekarang menggunakan SMTP (misal: Gmail, Hostinger, dll.)
 * Pastikan Anda sudah mengisi variabel berikut di .env:
 * SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, html }) {
    // Validasi Dasar
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Konfigurasi SMTP tidak lengkap. Email gagal dikirim.');
        console.log('--- EMAIL CONTENT (FALLBACK LOG) ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('------------------------------------');
        return { success: false, error: 'SMTP Configuration missing' };
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Arvela HR" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('Email terkirim (SMTP):', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('SMTP Send Error:', error);

        // Log konten ke console sebagai cadangan jika pengiriman gagal
        console.log('--- EMAIL CONTENT (FAILED SMTP DEBUG) ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Error:', error.message);
        console.log('-----------------------------------------');

        return { success: false, error: error.message };
    }
}
