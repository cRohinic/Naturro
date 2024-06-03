const nodemailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
         user: config.emailUser,
         pass: config.emailPassword,
    }
});

// Send OTP to mail for forgot password
const sendInsertOtp = async (email, otp) => {
    console.log(otp);
    const mailOptions = {
        from: '"Natuuro" <rohinic699@gmail.com>',
        to: email,
        subject: 'Your One Time Password - Natuuro',
        text: `Hi, your OTP is ${otp}`
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
        return otp;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        throw new Error('Failed to send OTP');
    }
};

module.exports = { sendInsertOtp };


