const express = require("express");
const user_route = express();


user_route.set('view engine','ejs')
user_route.set('views','./views/users');

const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));
const auth = require('../middleware/userAuth')

const userController = require("../controller/userController");
const productController = require('../controller/productcontroller');
const cartController =  require('../controller/cartController');
const checkoutController=require("../controller/checkoutController")
const couponController = require("../controller/couponController");
// const wishlistModel = require("../models/wishlistModel");
const wishlistController = require('../controller/wishlistController');
const walletController= require('../controller/walletController')
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isLogout,userController.getOtp);
user_route.post('/otp',userController.postOtp);
user_route.post('/resendotp',userController.resendOtp);

user_route.get('/userprofile',auth.isLogin,userController.loaduserProfile);
user_route.post('/userprofile',auth.isLogin,userController.editProfile)

user_route.get('/addaddress',auth.isLogin,userController.loadaddaddress);

user_route.post('/addaddress',auth.isLogin,userController.addaddress);

user_route.get('/editaddress',auth.isLogin,userController.loadeditAddress);
user_route.post('/editaddress',auth.isLogin,userController.editAddress);
user_route.get('/deleteaddress',auth.isLogin,userController.deleteAddress);
user_route.get('/shop',auth.isLogin,userController.loadShop);


// user_route.get('/')

user_route.get('/cart',auth.isLogin,cartController.loadAndShowCart);
user_route.post('/add-to-cart',auth.isLogin,cartController.addTocart)
user_route.post('/update-cart-quantity',auth.isLogin,cartController.updatequantity)

user_route.get('/applycoupon',auth.isLogin,couponController.Couponcart);
user_route.get('/removecoupon',auth.isLogin,couponController.removeCoupon);
user_route.get('/wishlist',auth.isLogin,wishlistController.loadwishlist);
user_route.get('/addToWishlist',auth.isLogin,wishlistController.addToWishlist);
user_route.get('/removewishlist',auth.isLogin,wishlistController. removeWishlist);
user_route.post('/orderOnlinePayment',auth.isLogin,checkoutController.razorpayVerify);
user_route.post('/orderonlineload',auth.isLogin,checkoutController.orderonlineload);
user_route.post('/razorpay',auth.isLogin,checkoutController.razorpayFn);
user_route.get('/payment',auth.isLogin,checkoutController.payment);
user_route.post('/cart-delete',auth.isLogin,cartController.deleteCart);
user_route.get('/checkout',auth.isLogin,checkoutController.loadcheckout);
user_route.post('/checkout',auth.isLogin,checkoutController.Postcheckout);
user_route.get('/orderconfirmed',auth.isLogin,checkoutController.loadorderconfirmed );
user_route.get('/orderDetails',auth.isLogin,checkoutController.loadorderdetails)
user_route.post('/orderDetails',auth.isLogin,userController.cancelorder)
user_route.get('/emailforgetpassword',auth.isLogin,userController.loadForgotPasswordemail);
user_route.post('/emailforgetpassword',auth.isLogin,userController.loadpasswordReset);
user_route.get('/forgetpassword',auth.isLogin,userController.loadForgotPassword);
user_route.post('/forgetpassword',auth.isLogin,userController.passwordReset);
user_route.get('/',auth.isLogout,userController.loginLoad);
user_route.post('/',userController.verifyLogin);
 user_route.get('/home',auth.isLogin,userController.loadHome);

user_route.post('/orderdetails/return',auth.isLogin, userController.returnOrder);
user_route.get('/newArrivals',auth.isLogin,userController.newArrivals);

user_route.get('/search',auth.isLogin,productController.showsearch);
user_route.post('/addToWallet',auth.isLogin,userController.addToWallet);
user_route.get('/productDetails',auth.isLogin,productController.loadIndividualProduct);
user_route.get('/productDetails',auth.isLogin,productController.updatepro );
user_route.get('/wallet',auth.isLogin,userController.loadwallet)
user_route.get('/pdf',auth.isLogin,userController.invoice);

user_route.get('/logout',userController.userLogout);
user_route.post('/retrypayment',auth.isLogin,checkoutController.revisePayment);
user_route.post('/failedPayment',auth.isLogin,checkoutController.failedPayment);
user_route.get('/googleSignUp',userController.googleSignUp)
user_route.get('/ordercancelled',checkoutController.orderCancelled)
module.exports = user_route;