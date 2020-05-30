const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1)create a transporter
  const transporter = nodemailer.createTransport({
    //if d service is define in nodemailer use this
    service:'Gmail',
    //or if not use this
    // host:process.env.EMAIL_HOST,
    // port: process.env.EMAIL_POST,

    auth:{
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }

  });

  //2) Define the email options
  const mailOptions = {
    from: 'jonas Schmedtmann <hello@jonas.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  //3) actually send the EMAIL
  await transporter.sendMail(mailOptions);

}
module.exports= sendEmail;
