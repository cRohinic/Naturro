const {couponModel} = require('../models/couponModel');
const cartModel = require('../models/cartModel');
const User = require('../models/userModel');
const {logout}= require('./admincontroller');


const listCoupons = async (req, res) => {
    try {
        
        const perPage=3;
            const page = parseInt(req.query.page) || 1;
            const totalcoupon= await couponModel.countDocuments({});
            const totalPage=Math.ceil(totalcoupon/ perPage);
            const coupons = await couponModel.find({}).skip(perPage * (page-1)).limit(perPage);
       res.render('couponlist',{coupons})
    } catch (error) {
        console.error("Error listing coupons:", error.message);
        res.status(500).json({ success: false, message: "Error listing coupons." });
    }
};



const loadcreatecoupon = async(req,res)=>{
    try{
     
       res.render('createCoupon');
    }catch(error){
      console.log(error.message);
    }
};





// const createCoupon = async (req, res) => {
//     console.log("calling create coupon")
//     try {
//         const {
//             code,
//             description,
//             discountPercentage,
//             minPurchaseAmount,
//             maxPurchaseAmount,
//             expirationDate,
//             maxUsers
//         } = req.body;
//         console.log(req.body,'coupon from body');
//         const newCoupon = new couponModel({
//             code,
//             description,
//             minimumAmount: minPurchaseAmount,
//             maximumAmount: maxPurchaseAmount,
//             discountPercentage:discountPercentage,
//             expirationDate: new Date(expirationDate),
//             maxUsers
//         });

//         await newCoupon.save();
//         console.log(await newCoupon.save(),"coupon saved");

//         res.status(200).json({ success: true, message: "Coupon created successfully." });
//         }catch (error) {
//             console.error("Error creating coupon:", error.message);
//             res.status(500).json({ success: false});
//         }
        
// };


const createCoupon = async (req, res) => {
    console.log("calling create coupon");
    try {
        const {
            code,
            description,
            discountPercentage,
            minPurchaseAmount,
            maxPurchaseAmount,
            expirationDate,
            maxUsers
        } = req.body;
        
        console.log(req.body, 'coupon from body');

        // Validate expirationDate
        const parsedExpirationDate = new Date(expirationDate);
        if (isNaN(parsedExpirationDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid expiration date." });
        }

        const newCoupon = new couponModel({
            code,
            description,
            minimumAmount: minPurchaseAmount,
            maximumAmount: maxPurchaseAmount,
            discountPercentage,
            expirationDate: parsedExpirationDate,
            maxUsers
        });

        await newCoupon.save();
        console.log("coupon saved", newCoupon);

        res.status(200).json({ success: true, message: "Coupon created successfully." });
    } catch (error) {
        console.error("Error creating coupon:", error.message);
        res.status(500).json({ success: false, message: "Failed to create coupon." });
    }
};




const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId, isActive } = req.body;

        // Find the coupon by ID and update its isActive field
        await couponModel.findByIdAndUpdate(couponId, { isActive: isActive });

        res.status(200).json({ success: true, message: "Coupon status toggled successfully." });
    } catch (error) {
        console.error("Error toggling coupon status:", error.message);
        res.status(500).json({ success: false, message: "Failed to toggle coupon status." });
    }
};

const Couponcart = async (req, res) => {
    try {
        const code = req.query.code;
        const coupon = await couponModel.findOne({ code: code });
        const user = await User.findById(req.session.user);
        const cart = await cartModel.findOne({ owner: user._id });

      
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        if (!user) {
            return res.status(404).send('User not found');
        }
        if (coupon.maxUsers === 0 || coupon.usersUsed.includes(user._id) || cart.isApplied) {
            return res.status(400).send('Coupon not applicable');
        }

        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        let discountAmount = 0;

        if (cart.billTotal <= 500) {
            discountAmount = (coupon.discountPercentage / 100) * cart.billTotal.toFixed();
            cart.billTotal -= discountAmount;
        } else {
            discountAmount = (coupon.discountPercentage / 100) * cart.billTotal.toFixed();
            cart.billTotal *= (1 - coupon.discountPercentage / 100);
        }
        cart.billTotal = Number(cart.billTotal.toFixed());


        cart.isApplied=true;
        cart.discountPrice=discountAmount.toFixed();
        cart.coupon=code;
        await cart.save();

        
        coupon.usersUsed.push(user._id);
        coupon.maxUsers--;
        await coupon.save();

        res.status(200).send('Coupon applied successfully');
    } catch (error) {
        console.error('Coupon cart error:', error.message);
        res.status(500).send('Internal server error');
    }
};

const removeCoupon=async(req,res)=>{
    try{
        const Fullcoupon = await couponModel.find();
        const user = await User.findById(req.session.user);
        const coupons= Fullcoupon.filter(coupon => coupon.usersUsed.includes(user._id));
        let coupon=coupons[0];
        const cart = await cartModel.findOne({ owner: user._id });
        if(cart.isApplied){
        cart.billTotal =cart.items.reduce((total, item) => total + item.price, 0);
        cart.isApplied=false;
        cart.coupon='nil';
        cart.discountPrice=0;
        await cart.save();
    
        const userIdIndex = coupon.usersUsed.indexOf(user._id);
        if (userIdIndex !== -1) {
            coupon.usersUsed.splice(userIdIndex, 1);
        }
        coupon.maxUsers++;
        
        await coupon.save();
    }
        
    res.status(200).send('Coupon updated successfully');
        
    }
    catch(error){
        console.log('removeCoupon:',error.message);
    }

}


module.exports= {
loadcreatecoupon,
listCoupons,
createCoupon,
toggleCouponStatus,
Couponcart,
removeCoupon
}