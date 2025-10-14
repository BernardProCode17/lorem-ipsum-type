/**
 * Email Utilities
 * Sends recovery codes to user emails WITHOUT storing the email
 * 
 * IMPORTANT PRIVACY NOTE:
 * - Email is used ONLY for delivery
 * - Email is NOT stored in database
 * - Email is NOT logged or tracked
 * - Email is deleted immediately after sending
 */

const nodemailer = require('nodemailer');

/**
 * Email service configuration
 * You can use: SendGrid, Mailgun, AWS SES, Resend, etc.
 * 
 * Environment variables required:
 * - EMAIL_SERVICE: 'sendgrid', 'mailgun', 'ses', 'smtp'
 * - EMAIL_API_KEY or SMTP credentials
 * - EMAIL_FROM: sender email address
 */

const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'smtp',
  from: process.env.EMAIL_FROM || 'noreply@lorem-type.com',
  fromName: process.env.EMAIL_FROM_NAME || 'Lorem Type'
};

/**
 * Create email transporter based on service
 * 
 * @returns {object} Nodemailer transporter
 */
function createTransporter() {
  const service = EMAIL_CONFIG.service;

  // ============================================
  // SMTP Configuration (Development/Self-hosted)
  // ============================================
  if (service === 'smtp') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // ============================================
  // SendGrid Configuration
  // ============================================
  if (service === 'sendgrid') {
    return nodemailer.createTransporter({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // ============================================
  // Mailgun Configuration
  // ============================================
  if (service === 'mailgun') {
    return nodemailer.createTransporter({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASS
      }
    });
  }

  // ============================================
  // AWS SES Configuration
  // ============================================
  if (service === 'ses') {
    const aws = require('aws-sdk');
    
    aws.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    return nodemailer.createTransporter({
      SES: new aws.SES({ apiVersion: '2010-12-01' })
    });
  }

  throw new Error(`Unsupported email service: ${service}`);
}

/**
 * Send recovery code to email
 * 
 * PRIVACY: Email is NOT stored anywhere
 * 
 * @param {string} email - Recipient email (NOT STORED)
 * @param {string} recoveryCode - The recovery code to send
 * @param {string} username - Username (for personalization)
 * @returns {Promise<void>}
 */
async function sendRecoveryEmail(email, recoveryCode, username) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Create transporter
    const transporter = createTransporter();

    // Email content
    const mailOptions = {
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to: email, // Recipient (NOT STORED)
      subject: 'Your Lorem Type Recovery Code',
      html: generateRecoveryEmailHTML(username, recoveryCode),
      text: generateRecoveryEmailText(username, recoveryCode)
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Recovery email sent:', info.messageId);
    
    // IMPORTANT: Email is NOT stored or logged
    // Variable 'email' goes out of scope after this function
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Failed to send recovery email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Generate HTML email content for recovery code
 * 
 * @param {string} username - Username
 * @param {string} recoveryCode - Recovery code
 * @returns {string} HTML content
 */
function generateRecoveryEmailHTML(username, recoveryCode) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .recovery-code {
          background: #fff;
          border: 2px solid #667eea;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          letter-spacing: 3px;
          color: #667eea;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .privacy-notice {
          background: #d1ecf1;
          border-left: 4px solid #0c5460;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔐 Account Recovery</h1>
      </div>
      
      <div class="content">
        <p>Hi <strong>${username}</strong>,</p>
        
        <p>Here is your Lorem Type recovery code:</p>
        
        <div class="recovery-code">
          ${recoveryCode}
        </div>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> Save this code in a safe place. You'll need it to recover your account if you forget your abbreviation or PIN.
        </div>
        
        <p><strong>What you can do with this code:</strong></p>
        <ul>
          <li>Reset your abbreviation and PIN if you forget them</li>
          <li>Verify your account ownership</li>
        </ul>
        
        <p><strong>Security Tips:</strong></p>
        <ul>
          <li>Don't share this code with anyone</li>
          <li>Store it in a password manager or secure note</li>
          <li>This code works indefinitely until you generate a new one</li>
        </ul>
        
        <div class="privacy-notice">
          <strong>🔒 Privacy Notice:</strong><br>
          Your email address was used ONLY to deliver this recovery code. We do NOT store, track, or keep any record of your email. This is a one-time delivery to respect your privacy.
        </div>
      </div>
      
      <div class="footer">
        <p>If you didn't request this recovery code, someone may have entered your username by mistake. You can safely ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} Lorem Type. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email content for recovery code
 * 
 * @param {string} username - Username
 * @param {string} recoveryCode - Recovery code
 * @returns {string} Plain text content
 */
function generateRecoveryEmailText(username, recoveryCode) {
  return `
ACCOUNT RECOVERY
================

Hi ${username},

Here is your Lorem Type recovery code:

${recoveryCode}

⚠️ IMPORTANT: Save this code in a safe place. You'll need it to recover your account if you forget your abbreviation or PIN.

What you can do with this code:
- Reset your abbreviation and PIN if you forget them
- Verify your account ownership

Security Tips:
- Don't share this code with anyone
- Store it in a password manager or secure note
- This code works indefinitely until you generate a new one

🔒 PRIVACY NOTICE:
Your email address was used ONLY to deliver this recovery code. We do NOT store, track, or keep any record of your email. This is a one-time delivery to respect your privacy.

---

If you didn't request this recovery code, someone may have entered your username by mistake. You can safely ignore this email.

© ${new Date().getFullYear()} Lorem Type. All rights reserved.
  `.trim();
}

/**
 * Send test email (for configuration testing)
 * 
 * @param {string} email - Test email address
 * @returns {Promise<void>}
 */
async function sendTestEmail(email) {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${EMAIL_CONFIG.fromName}" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: 'Lorem Type - Email Configuration Test',
      html: '<h1>Email Configuration Successful!</h1><p>Your email service is configured correctly.</p>',
      text: 'Email Configuration Successful! Your email service is configured correctly.'
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Test email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
}

module.exports = {
  sendRecoveryEmail,
  sendTestEmail,
  EMAIL_CONFIG
};
