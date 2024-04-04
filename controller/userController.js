const ProductModel = require('../models/productModel');
const User = require('../models/userModel');
const {sendInsertOtp} = require("../util/insertotp");
const {generateOTP}=require('../util/otpgenerator');
const bcrypt = require("bcrypt");


const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
};

const loadRegister = async(req,res)=>{
    try{
      res.render('registration');
    }
    catch(error){
        console.log(error.message);
    }
}


const insertUser = async(req,res)=>{
    try {
     
       //generate OTP
       const otp = generateOTP();
     


       //storing into session
       req.session.Data = {...req.body,otp};
       req.session.save();
       console.log(otp);
       console.log(req.session.Data);
      
       const sentEmail = await sendInsertOtp(req.session.Data.email,otp);
       if(sentEmail){
        res.redirect('/otp');
       }

    }
    catch(error){
        console.log('insert user',error.message);
        
    }
}

const getOtp=async(req,res)=>{
try{
res.render('otp')
}
catch(error){
    console.log('otp',error.message);
}
}

//login user methods started

const loginLoad = async(req,res)=>{
    try{
        res.render('login',{message:null});
    }
    catch(error){
        console.log(error.message);
    }
}

const postOtp=async(req,res)=>{
try{

    const otpInBody = req.body.otp;
  
    const otp = req.session.Data.otp;
    console.log(otpInBody,otp);

    if(otpInBody === otp){
        const {name,email,mobile,password} = req.session.Data

        console.log("username:",name);
        console.log("email:",email);
        console.log("mobile:",mobile); 
        console.log("password:",password); 

       
        const passwordHash = await securePassword(req.session.Data.password);
        const existingUser = await User.findOne({email:email})
        if(!existingUser){
            const user = new User({
                name: name,
                email: email,
                mobile: mobile,
                password: passwordHash,
                is_admin: 0,
                is_verified: 1,
                is_blocked: false
            });
            await user.save();
        }
        return res.redirect('/'); 
    }
    else{
        return res.status(400).json({error:"otp invalid"}); 
    }

}
catch(error){
    console.log('post Otp',error.message);
}
}

const verifyLogin=async(req,res)=>{
try{
    const { email,password } = req.body;
   
     if(!email || !password){
        
         return res.render('login',{message:'Email and Password are required'});
     }
     const userData = await User.findOne({ email });
   
     if(!userData){
        return res.render('login',{message:'user not found'});
     }
     if(userData.is_blocked){
        return res.render('login',{message:'Sorry ,user is blocked'});
     }
     const hashedPassword = await bcrypt.compare(password,userData.password);
     if(!hashedPassword){
        return res.render('login',{message:'Invalid password'});
     }
     if(email===userData.email && hashedPassword ){
         req.session.user = userData._id;
       
       
         res.redirect('/home');
     }
}
catch(error){
console.log('verify login',error.message);
}
}


const loadHome = async(req,res)=>{
    try{
        const product=await ProductModel.find({is_deleted:true})
        console.log(product);
        res.render('home',{product});

    }catch(error){
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{
    try{
        req.session.user =false;
        res.redirect('/');
    }catch(error){
        console.log(error.message)
    }
}





let resendOtp = async (req, res) => {
    try {
        console.log('hi');
        const otp = generateOTP();
        console.log(req.session.Data.email);
         await sendInsertOtp(req.session.Data.email, otp);
    
            req.session.Data.otp=otp;
            res.status(200).json({
                status: true
              })
              
   
      
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({
        status: false,
        message: 'Error resending OTP'
      });
    }
  };

module.exports = {
    loadRegister,
    insertUser,
    getOtp,
    postOtp,
    loginLoad,
    verifyLogin,
    loadHome,
    userLogout,
    resendOtp
}