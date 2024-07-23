const express = require("express");
const admin_route = express();

const multer = require('multer');


const session = require("express-session");
const config = require("../config/config");


admin_route.use(session({secret:config.sessionSecret}));


const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));



const auth = require("../middleware/adminAuth");


admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');




const adminController = require('../controller/admincontroller');

const category=require('../controller/categorycontroller');
const productController = require('../controller/productcontroller');
const couponController =require('../controller/couponController');
const walletController = require('../controller/walletController')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'./uploads/productImages');
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    }
});

const upload = multer({storage:storage}).array('images',3);



admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',adminController.verifyAdmin);
admin_route.get('/home',auth.isLogin,adminController.loadDashboard);
admin_route.get('/logout',adminController.logout);
admin_route.get('/userlist',auth.isLogin,adminController.listUser);
admin_route.get('/block-user',auth.isLogin,adminController.blockUser);
admin_route.get('/unblock-user',auth.isLogin,adminController.unblockUser);
admin_route.get('/category',auth.isLogin,adminController.loadCategory);
admin_route.post('/category',auth.isLogin,category.createCategory);

admin_route.get('/order',auth.isLogin,adminController.loadorder);

admin_route.get('/couponlist',auth.isLogin,couponController.listCoupons);
admin_route.get('/createcoupon',auth.isLogin,couponController.loadcreatecoupon);
admin_route.post('/createcoupon',auth.isLogin,couponController.createCoupon)
admin_route.post('/togglecoupon',auth.isLogin,couponController.toggleCouponStatus);

admin_route.get('/adminorderDetails',auth.isLogin,adminController.loadorderdetails);
admin_route.post('/acceptcancel',auth.isLogin,adminController.requestAccept);
admin_route.post('/rejectcancel',auth.isLogin,adminController.requestCancel);
admin_route.post('/updateorderstatus',auth.isLogin,adminController.updateorder);


admin_route.get("/adminsales",auth.isLogin,adminController. loadsales)
admin_route.get("/salesDate",auth.isLogin,adminController.dateFilter)
admin_route.post('/filterData',adminController.filterData);
admin_route.get('/offer',auth.isLogin,adminController.offer);

admin_route.post('/categoryoffer',auth.isLogin,adminController.categoryoffer);
admin_route.get("/date",auth.isLogin,adminController.sortDate)

admin_route.get('/pdf',auth.isLogin,adminController.pdf);
admin_route.get('/edit-cate',auth.isLogin,category.editCategoryLoad);
admin_route.post('/edit-cate',auth.isLogin,category.updateCate);
admin_route.get('/delete-cate',auth.isLogin,auth.isLogin,category.deleteCate);
admin_route.get('/product',auth.isLogin,productController.loadProduct);
admin_route.post('/product',auth.isLogin,upload,productController.addProduct);
admin_route.get('/active',auth.isLogin,productController.activeStatus);
admin_route.get('/editproduct',auth.isLogin,productController.loadEdit);
admin_route.post('/editproduct',auth.isLogin,upload,productController.editProduct);
admin_route.get('/deleteimage',auth.isLogin,productController.deleteimage);
admin_route.get('/excel',auth.isLogin,adminController.generateExcel);

module.exports = admin_route;