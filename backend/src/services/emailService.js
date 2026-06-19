const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (toEmail, userName, resetUrl) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"CRMS" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: 'CRMS Password Reset Request',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>CRMS Password Reset Request</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f7;
            color: #51545e;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: none;
          }
          .email-wrapper {
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: #f4f4f7;
          }
          .email-content {
            width: 100%;
            max-width: 570px;
            margin: 0 auto;
            padding: 24px;
          }
          .email-body {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 32px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          h1 {
            color: #1e293b;
            font-size: 20px;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 20px;
            text-align: left;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            margin-top: 0;
            margin-bottom: 18px;
            text-align: left;
          }
          .button-wrapper {
            margin: 30px auto;
            text-align: center;
          }
          .button {
            background-color: #6366f1;
            border-radius: 6px;
            color: #ffffff !important;
            display: inline-block;
            font-size: 15px;
            font-weight: bold;
            line-height: 45px;
            text-align: center;
            text-decoration: none;
            width: 200px;
            -webkit-text-size-adjust: none;
          }
          .footer {
            margin-top: 25px;
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-content">
            <div class="email-body">
              <h1>Hello ${userName},</h1>
              <p>A password reset request was received for your account.</p>
              <p>Click the button below to reset your password:</p>
              <div class="button-wrapper">
                <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
              </div>
              <p>This link will expire in 1 hour.</p>
              <p>If you did not request this reset, you can safely ignore this email.</p>
              <div class="footer">
                <p>Regards,<br>Campus Recruitment Management System</p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
};
