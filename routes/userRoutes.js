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

user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isLogout,userController.getOtp);
user_route.post('/otp',userController.postOtp);
user_route.post('/resendotp',userController.resendOtp);

user_route.get('/userprofile',userController.loaduserProfile);
user_route.post('/userprofile',userController.editProfile)

user_route.get('/addaddress',userController.loadaddaddress);

user_route.post('/addaddress',userController.addaddress);

user_route.get('/editaddress',userController.loadeditAddress);
user_route.post('/editaddress',userController.editAddress);
user_route.get('/deleteaddress',userController.deleteAddress);
user_route.get('/shop',auth.isLogin,userController.loadShop);


user_route.get('/')

user_route.get('/cart',cartController.loadAndShowCart);
user_route.post('/add-to-cart',cartController.addTocart)
user_route.post('/update-cart-quantity',cartController.updatequantity)

user_route.get('/applycoupon',couponController.Couponcart);
user_route.get('/removecoupon',couponController.removeCoupon);
user_route.get('/wishlist',wishlistController.loadwishlist);
user_route.get('/addToWishlist',wishlistController.addToWishlist);
user_route.get('/removewishlist',wishlistController. removeWishlist);
user_route.post('/orderOnlinePayment',checkoutController.razorpayVerify);
user_route.post('/orderonlineload',checkoutController.orderonlineload);
user_route.post('/razorpay',checkoutController.razorpayFn);
user_route.get('/payment',checkoutController.payment);
user_route.post('/cart-delete',cartController.deleteCart);
user_route.get('/checkout',checkoutController.loadcheckout);
user_route.post('/checkout',checkoutController.Postcheckout);
user_route.get('/orderconfirmed',checkoutController.loadorderconfirmed );
user_route.get('/orderDetails',checkoutController.loadorderdetails)
user_route.post('/orderDetails',userController.cancelorder)
user_route.get('/emailforgetpassword',userController.loadForgotPasswordemail);
user_route.post('/emailforgetpassword',userController.loadpasswordReset);
user_route.get('/forgetpassword',userController.loadForgotPassword);
user_route.post('/forgetpassword',userController.passwordReset);
user_route.get('/',auth.isLogout,userController.loginLoad);
user_route.post('/',userController.verifyLogin);
user_route.get('/home',auth.isLogin,userController.loadHome);
user_route.post('/orderdetails/return', userController.returnOrder);
user_route.get('/newArrivals',userController.newArrivals);

user_route.get('/search',auth.isLogin,productController.showsearch);
user_route.post('/addToWallet',userController.addToWallet);
user_route.get('/productDetails',auth.isLogin,productController.loadIndividualProduct);
user_route.get('/productDetails',auth.isLogin,productController.updatepro );

user_route.get('/pdf',userController.invoice);

user_route.get('/logout',userController.userLogout);
user_route.post('/retrypayment',checkoutController.revisePayment);

module.exports = user_route;