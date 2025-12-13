const nodemailer = require('nodemailer');

let testAccount = null;

// Initialize test account once
const getTransporter = async () => {
    if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
        console.log('✨ Ethereal Email Service Initialized');
        console.log('📧 Account User:', testAccount.user);
        console.log('🔑 Account Pass:', testAccount.pass);
    }

    // Create reusable transporter object using the default SMTP transport
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
};

/**
 * Send an email using Ethereal (Test Account)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 * @returns {Promise<string>} - Preview URL
 */
const sendEmail = async (to, subject, html) => {
    try {
        const transporter = await getTransporter();

        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"DAANSETU Support" <support@daansetu.com>',
            to,
            subject,
            html,
        });

        console.log('✅ Email sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log('🔗 Preview URL: %s', previewUrl);

        return previewUrl;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
