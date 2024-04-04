const nodemailer = require("nodemailer");
const config = require("../config/config");


//create a transport object using SMTP transport

const transporter = nodemailer.createTransport({
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    requireTLS:true,
    auth:{
         user:config.emailUser,
         pass:config.emailPassword,
    }
});


//sent otp to mail for forget Password

const sendInsertOtp = async(email, otp) => {

    const mailOptions = {
        from:'"natuuro" <rohinic699@gmail.com>',
        to:email,
        subject: 'your one time password ,natuuro',
        text:`hi,Your OTP is ${otp}`
    };
    try{
        
        const info = await transporter.sendMail(mailOptions);
        console.log("Email send Successfull:",info.response);
        console.log(otp);
        return otp;
    }catch(error){
        console.error('Error sending OTP email:',error);
        throw new Error('Failed to send otp');
    }

};
module.exports = { sendInsertOtp };

