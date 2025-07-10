const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error: ', error);
    return false;
  }
};

// Email templates
exports.emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Journal Publication Platform',
    message: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for registering with our journal publication platform.</p>
      <p>You can now submit articles and participate in the academic community.</p>
    `
  }),
  
  articleSubmission: (title) => ({
    subject: 'Article Submission Confirmation',
    message: `
      <h1>Article Submission Received</h1>
      <p>Your article "${title}" has been successfully submitted.</p>
      <p>We will review it and get back to you soon.</p>
    `
  }),

  reviewInvitation: (articleTitle, reviewDeadline) => ({
    subject: 'Invitation to Review Article',
    message: `
      <h1>Review Invitation</h1>
      <p>You are invited to review the article: "${articleTitle}"</p>
      <p>Please submit your review by: ${reviewDeadline}</p>
    `
  })
}; 