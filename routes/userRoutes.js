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


user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',userController.insertUser);
user_route.get('/otp',auth.isLogout,userController.getOtp);
user_route.post('/otp',userController.postOtp);
user_route.post('/resendotp',userController.resendOtp);


user_route.get('/',auth.isLogout,userController.loginLoad);
user_route.post('/',userController.verifyLogin);


user_route.get('/home',auth.isLogin,userController.loadHome);

user_route.get('/productDetails',productController.loadIndividualProduct);

user_route.get('/editproduct',productController.deleteProduct);
user_route.get('/logout',userController.userLogout);

module.exports = user_route;