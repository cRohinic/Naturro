const ProductModel = require('../models/productModel');
const addressModel=require('../models/addressModel');
const orderModel = require('../models/orderModel');
const User = require('../models/userModel');
const {sendInsertOtp} = require("../util/insertotp");
const {generateOTP}=require('../util/otpgenerator');
const bcrypt = require("bcrypt");
const wishlistModel=require('../models/wishlistModel')
const walletModel = require('../models/walletModel');
const cartModel=require('../models/cartModel')
var easyinvoice = require('easyinvoice');
const categoryModel=require('../models/categoryModel')



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
       const otp = generateOTP();
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
res.render('otp',{message:null})
}
catch(error){
    console.log('otp',error.message);
}
}


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
        return res.render('otp',{message:"Invalid OTP"})
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
        const product=await ProductModel.find({is_deleted:false})
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

const loaduserProfile = async(req,res)=>{
try{
    let product=await  orderModel.find({list:true})
    const perPage=8;
        const page = parseInt(req.query.page) || 1;
        const totalproducts= await orderModel.countDocuments({});
        const totalPage=Math.ceil(totalproducts / perPage);
       let address =await addressModel.findOne({user: req.session.user}) || null;
       let orders = await orderModel.find({ user: req.session.user}).skip(perPage * (page-1)).limit(perPage).sort({_id:-1})
       ;
       const user = await User.findById(req.session.user);
       const wallet = await walletModel.findOne({ user: req.session.user }).sort({_id:-1}) ;
       
       
     console.log('///////////',orders);
        res.render('userprofile', { user,address,orders,wallet});

}catch(error){

    console.log('loaduserProfile Error:', error.message);

}
}


const editProfile = async(req,res)=>{
    try{
let address = await addressModel.findOne({
    user:req.session.user
})|| null;
const { name,mobile } = req.body;
console.log(name,mobile);

const user =  await User.findById(req.session.user);
 const orders =await orderModel.findOne({user:req.session.user});
const updatedUser = await User.findOneAndUpdate(
    { _id: req.session.user},
    {
      $set: {
        name: name,
        mobile: mobile
      }
    },
    { new: true }
  );
  let wallet = await walletModel.findOne({user:req.session.user}) || null;

  if (updatedUser) {
    return res.render('userprofile', { message: 'Updated successfully!', user: updatedUser,address:null,orders,wallet});
    // return res.render('user-detail', { message: 'Updated successfully!', user: updatedUser ,wish,cart});

  } else {
    return res.render('userprofile', { error: 'Failed to update user details.', user,address:null,orders,wallet});
    // return res.render('user-detail', { error: 'Failed to update user details.', user,wish,cart });
  }


    }catch(error){
        console.log(error.message)
    }
}

const loadaddaddress = async(req,res)=>{
    try{
    res.render('addaddress');
    }catch(error){
        console.log(error.message);
    }
};



const addaddress = async(req,res)=>{
    try{
        
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
          } = req.body;
          
      const user = await User.findById(req.session.user);
      
      if (!user) {
       console.log('user is not found');
      }
  
     
      let useraddresses = await addressModel.findOne({
        user: user._id
      });
  
      if (!useraddresses) {
        // If the useraddresses document doesn't exist, create a new one
        useraddresses = new addressModel({
          user:  user._id,
          addresses: []
        });
      }

      const existingAddress = useraddresses.addresses.find((address) =>
      address.addressType === addressType &&
      address.HouseNo === houseNo &&
      address.Street === street &&
      address.pincode === pincode &&
      address.Landmark === landmark &&
      address.city === city &&
      address.district === district&&
      address.State === state &&
      address.Country === country
    );
    const existtype=useraddresses.addresses.find((address) =>address.addressType === addressType);
    if (existingAddress) {
     
      res.render('addAddress',{error:'Address already exists for this user',address:null,orders:null});
      // res.render('add-address',{error:'Address already exists for this user',wish,cart});
    }
    
    else if(existtype) {
     
      res.render('addAddress',{error:`${existtype.addressType} is alredy registered`,address:null,orders:null});
      // res.render('add-address',{error:`${existtype.addressType} is alredy registered`,wish,cart});
    }
  
    else if (useraddresses.addresses.length >= 3) {
      
      res.render('addAddress',{error:'User cannot have more than 3 addresses',address:null,orders:null});
      // res.render('add-address',{error:'User cannot have more than 3 addresses',cart,wish});
    }
else{
    // Create a new address object
    const newAddress = {
      addressType: addressType,
      HouseNo: houseNo,
      Street: street,
      Landmark: landmark,
      pincode: pincode,
      city: city,
      district: district,
      State: state,
      Country: country,
    };

    useraddresses.addresses.push(newAddress);


    await useraddresses.save();

   res.redirect('/userProfile');
  }



    }catch{

    }
}

const loadeditAddress =async(req,res)=>{
    try{
      const user= await User.findById(req.session.user);
      // console.log(user)
      let useraddresses = await addressModel.findOne({
        user:user._id
      });
      //console.log(useraddresses)
      const addressType=req.query.addressType;
      
      const address = useraddresses.addresses.find(address => address.addressType === addressType);
   
  
  if (address) {
     
      res.render('editaddress', { addresses: address });
  
  } else {
      
      console.log('Address or HouseNo not found');
      
  }
  
    
    }
    catch(error){
      console.log('editAddress',error.message);
    }
  
  };

  const editAddress = async (req, res) => {
    try {
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } = req.body;

        const addresses = await addressModel.findOne({
            user: req.session.user
        });

        if (!addresses) {
            console.log('Address is not found');
            // Handle the case where addresses are not found
            return res.status(404).send('Address not found');
        }

        const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

        if (!addressToEdit) {
            console.log('Address with type not found');
            // Handle the case where the specified address type is not found
            return res.status(404).send('Address type not found');
        }

        // Update the address fields
        addressToEdit.HouseNo = houseNo;
        addressToEdit.Street = street;
        addressToEdit.Landmark = landmark;
        addressToEdit.pincode = pincode;
        addressToEdit.city = city;
        addressToEdit.district = district;
        addressToEdit.State = state;
        addressToEdit.Country = country;

        // Save the changes
        await addresses.save();
        const user=await User.findById(req.session.user)
        const orders = await orderModel.findOne({user:user._id});
        

        // Render the editAddress template with the updated addresses
        return res.redirect('/userprofile');
    } catch (err) {
        console.error('editAddress:', err.message);
        // Handle errors
        return res.status(500);
    }
};
 

const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const addresses = await addressModel.findOne({
            user: user._id
        });

        const addressTypeToDelete = req.query.addressType;

        const addressIndexToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete);

        if (addressIndexToDelete === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        addresses.addresses.splice(addressIndexToDelete, 1);
        await addresses.save();

        // Redirect to the user profile page after deleting the address
        return res.redirect('/userProfile');
    } catch (error) {
        console.log('deleteAddress', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const loadShop = async (req, res) => {
    try {
        let product=await  ProductModel.find({list:true})
        const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await ProductModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage);
        let sortOption = {};

        // Determine the sort option based on query parameter
        switch (req.query.sort) {
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'priceAsc':
                sortOption = { discountPrice: 1 };
                break;
            case 'priceDesc':
                sortOption = { discountPrice: -1 };
                break;
            case 'newness':
                sortOption = { createdAt: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDesc':
                sortOption = { name: -1 };
                break;
            default:
                sortOption = { name: -1 };
                break;
        }

        console.log(sortOption);

        let query = { is_deleted: false };

        // Add search filter to the query if present
        const search = req.query.search;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ];
        }

        // Add category filter 
        if (req.query.category) {
            const category = await categoryModel.findOne({ name: req.query.category });
            if (category) {
                query.category = category._id;
            }
        }

        // Fetch the products based on the query and sort options
        let products = await ProductModel.find(query).sort(sortOption).populate('category').skip(perPage * (page - 1))
                .limit(perPage).sort({_id:-1});
        if (!products) {
            products = [];
        }

        // Fetch the user's wishlist
        const wish = await wishlistModel.findOne({ user: req.session.user }) || null;

        console.log(wish);
        console.log(products);

        // Render the shop page with the products and wishlist
        res.render('shop', { product:products, wish,req});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};




// const cancelorder = async (req, res) => {
//     try {
//         const { reason, oId } = req.body;

//         if (!reason || !oId) {
//             return res.status(400).json({ success: false, error: "Reason and orderId are required" });
//         }

//         const order = await orderModel.findOne({oId: oId });
        

//         if (!order) {
//             return res.status(404).json({ success: false, error: "Order not found" });
//         }

//         // Add cancellation request to the order
//         const newCancelRequest = {
//             type: 'Cancel',
//             status: 'Pending',
//             reason:' reason'
//         };

//         order.requests.push(newCancelRequest);
//         await order.save();

//         // Update order status to "Cancelled"
//         order.status = 'Canceled';
//         await order.save();
           
//         res.json({ success: true, message: "Order cancelled successfully", order });
//     } catch (error) {
//         console.error("cancelOrder error:", error);
//         return res.status(500).json({ success: false, error: "Internal server error" });
//     }
// }


const cancelorder = async (req, res) => {
    try {
        const { reason, oId } = req.body;

        if (!reason || !oId) {
            return res.status(400).json({ success: false, error: "Reason and orderId are required" });
        }

        const order = await orderModel.findOne({ oId: oId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        // Add cancellation request to the order
        const newCancelRequest = {
            type: 'Cancel',
            status: 'Pending',
            reason: reason
        };

        order.requests.push(newCancelRequest);

        // Update order status to "Cancelled"
        order.status = 'Canceled';
        await order.save();

        // Update stock quantities for each product in the canceled order
        for (const item of order.items) {
            const product = await productModel.findById(item.productId);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        res.json({ success: true, message: "Order cancelled successfully", order });
    } catch (error) {
        console.error("cancelOrder error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
























const loadForgotPassword  = async(req,res)=>{
    try{

        res.render('forgetpassword');
    }catch(error){
        console.log(error.message)
    }
};



const passwordReset = async (req, res) => {
    try {
        const { otp, newPassword, confirmNewPassword } = req.body;
        console.log(otp, newPassword, confirmNewPassword)
        const { Data } = req.session;
        //    console.log(Data );
        // // Validate session Data and OTP
        // if (!Data || !Data.otp || otp !== Data.otp) {
        //     return res.status(400).json({ message: "Invalid or expired OTP." });
        // }

        // Validate passwords match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password in the database
        const user = await User.findOneAndUpdate(
            { email: Data.email }, // Make sure 'email' is correctly indexed and exists in your User model
            { password: hashedPassword },
            { new: true }
        );

        // Clear the session data related to password reset
        delete req.session.Data;

        return res.redirect('/');
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
};


const loadForgotPasswordemail = async(req,res)=>{
    try{
        res.render('emailforgetpassword');
    }catch(error){
        console.log(error.message);
    }
}


const loadpasswordReset = async (req, res) => {
    try {
        if (req.body.email && !req.body.otp) {
            const user = await User.findOne({ email: req.body.email });
            if(!user){
               
                console.log("User Not Found");
                return res.render('emailforgetpassword',{message:"user is not found"});
            }
            const otp = generateOTP();
            await sendInsertOtp(req.body.email, otp);

            if (!req.session.Data) {
                req.session.Data = {};
            }

            req.session.Data.otp = otp;
            req.session.Data.email = req.body.email;

            return res.redirect('/forgetpassword');
        }
    } catch (error) {
        console.error('Error during password reset:', error);
        return res.status(500).send({ error: `An error occurred while processing your request: ${error.message}` });
    }
};


const addToWallet=async(req,res)=>{
    var instance = new razorpay({
        key_id: 'rzp_test_V59oBpkY2QETZI',
        key_secret: 'GtMFeNLoY2TwkFdis5LoaQFz',
    });
  
   
    const amount = Number(req.body.amount);
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided.",
      });
    }
  
    var options = {
      amount: amount * 100,  
      currency: "INR",
    };
  
  
    try {
      const razorpayOrder = await instance.orders.create(options);
      console.log(razorpayOrder);
      res.status(201).json({
        success: true,
        message: "Wallet updated successfully.",
        order: razorpayOrder,
      });
    } catch (orderError) {
    
      console.error('Razorpay Order Creation Error:', orderError);
      res.status(500).json({
        success: false,
        message: "Failed to create order with Razorpay.",
      });
    }
  
  
  }





  const returnOrder = async (req, res) => {
    try {
        const { reason, oId } = req.body;

        if (!reason || !oId) {
            return res.status(400).json({ success: false, error: "Reason and orderId are required" });
        }

        const order = await orderModel.findOne({ oId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        // Check if the order status is 'Delivered' to allow return request
        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, error: "Cannot return order. Order is not delivered yet." });
        }

        // Add return request to the order
        const newReturnRequest = {
            type: 'Return',
            status: 'Pending',
            reason: reason
        };
        
        order.requests.push(newReturnRequest);
        await order.save();

        res.json({ success: true, message: "Return request submitted successfully" });
    } catch (error) {
        console.error("returnOrder error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};



const newArrivals=async(req,res)=>{
    try{
    const perPage=8;
    const page = parseInt(req.query.page) || 1;
    const totalproducts= await ProductModel.countDocuments({});
    const totalPage=Math.ceil(totalproducts / perPage);
    const userData = await User.findById(req.session.user)
    
    let wish=await wishlistModel.findOne({user:userData._id});
    
    if(!wish){
      wish=null;
    }
    let cart=await cartModel.findOne({owner:userData._id});
    
    if(!cart)
    {
      cart=null
    }
    const search = req.query.search || '';
                
    let sortQuery = {};
    
    const sort = req.query.sort || '';
    
    if (sort === 'lowtohigh') {
        sortQuery = { price: 1 };
    } else if (sort === 'hightolow') {
        sortQuery = { price: -1 };
    } else if (sort === 'a-z') {
        sortQuery = { name: 1 };
    } else if (sort === 'z-a') {
        sortQuery = { name: -1 };
    } else if (sort === 'featured') {
      product=await ProductModel.find({list:true,isFeatured: true }).populate('category').sort(sortQuery).skip(perPage * (page - 1))
      .limit(perPage);
    } else if (sort === 'popularity') {
        sortQuery = { popularity: -1 };
    } else if (sort === 'averagerating') {
      sortQuery = { "review.rating": -1 };
    } else if (sort === 'Newarrivals') {
        sortQuery = { createdAt: -1 };
    }
    if (search !== '') {
        product = await ProductModel
            .find({
                
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } }
                ]
            })
            .populate('category')
            .sort(sortQuery).skip(perPage * (page - 1))
            .limit(perPage).limit(5) ;
    }else if(sort){
        product = await ProductModel.find({}).populate('category').sort(sortQuery).skip(perPage * (page - 1))
        .limit(perPage).limit(5) ;
    }else{
    product = await ProductModel.find({}).populate('category').skip(perPage * (page - 1))
    .limit(perPage) .sort({ createdAt: -1 })
    .limit(5) ;
    }
    res.render('newarrivals', { product, wish, totalPage, page, wish, cart,sort });
    
    }
    catch(error){
      console.log('new Arrivals',error.message);
    
    }
    }
    



    const invoice = async (req, res) => {
        try {
          
            const order = await orderModel.findById(req.query.id).populate('user');
        
            
            if (!order) {
                return res.status(404).send('Order not found');
            }
      
            
            const data = {
                "documentTitle": "INVOICE", 
                "currency": "INR",
                "taxNotation": "gst", 
                "marginTop": 25,
                "marginRight": 25,
                "marginLeft": 25,
                "marginBottom": 25,
                "logo": "https://public.easyinvoice.cloud/img/logo_en_original.png", 
                "background": "https://public.budgetinvoice.com/img/watermark_draft.jpg", 
                "sender": {
                    "company": "NATUURO",
                    "address": "KOTTARAKKARA,KOLLAM,KERALA",
                    "zip": "987654",
                    "city": "KOTTARAKKARA",
                    "country": "INDIA" 
                },
                "client": {
                    "company": order.user.name, 
                    "address": order.deliveryAddress.Street, 
                    "zip": order.deliveryAddress.pincode,
                    "city": order.deliveryAddress.city,
                    "country": order.deliveryAddress.Country 
                },
              
                "products": order.items.map(item => ({
                  "description": item.name,
                  "quantity": item.quantity,
                  "price": item.price,
                 
              })),
              "information": {
              
              
                "date": order.updatedAt.toLocaleDateString('en-US', { timeZone: 'UTC' })
            },
            
                 
               
            };
      
            const result = await easyinvoice.createInvoice(data); 
      
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
            res.send(Buffer.from(result.pdf, 'base64')); 
        } catch (error) {
            console.error('Error generating invoice:', error.message);
      
        }
      };
      
 const googleSignUp = async(req,res)=>{
    console.log('googlesignUp  open');
    try{
        console.log('ghfgf');
const email = req.user.email;
console.log(email);
let userData;
userData = await User.findOne({email:email});
if(!userData){
    const user = new User({
        name: req.user.name,
        email: req.user.email,
        mobile: "123456789",
        is_admin: 0,
        is_verified: 1,
        is_blocked: false
    })
    userData = await user.save();
    req.session.email = req.user.email;
    req.session.user = userData._id;
    req.session.save();
    console.log(userData,"googledata");
    res.redirect('/home')
}
    }catch(error){
        console.log('error');
    }
 }



//  const loadwallet = async (req, res) => {
//     try {
//       const wallet = await walletModel.findOne({ user: req.session.user });
//       const perPage=4;
//       const page = parseInt(req.query.page) || 1;
//       const totalwallet= await walletModel.countDocuments({});
//       const totalPage=Math.ceil(totalwallet / perPage);
//       if (!wallet) {
//         return res.status(404).render('wallet', { wallet: null, message: 'Wallet not found' });
//       }

     
//   console.log(wallet);
//       res.render('wallet', { wallet });
//       const wallet1 = await walletModel.findOne({ user: req.session.user }).skip(perPage * (page-1)).limit(perPage).sort({_id:-1})
//     } catch (error) {
//       console.log('loadWallet Error:', error.message);
//       res.status(500).render('error', { message: 'Internal Server Error' });
//     }
//   };
  
const loadwallet = async (req, res) => {
    try {
      const userId = req.session.user;
      const wallet = await walletModel.findOne({ user: userId });
  
      if (!wallet) {
        return res.status(404).render('wallet', { wallet: null, message: 'Wallet not found' });
      }
  
      const perPage = 5;
      const page = parseInt(req.query.page) || 1;
      const sortField = req.query.sortField || 'updatedAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  
      // Retrieve the total number of transactions
      const totalTransactions = wallet.transactions.length;
      const totalPages = Math.ceil(totalTransactions / perPage);
  
      // Sort transactions
      const sortedTransactions = wallet.transactions.sort((a, b) => {
        if (a[sortField] < b[sortField]) return -1 * sortOrder;
        if (a[sortField] > b[sortField]) return 1 * sortOrder;
        return 0;
      });
  
      // Paginate transactions
      const paginatedTransactions = sortedTransactions.slice((page - 1) * perPage, page * perPage);
  
      // Create a new wallet object with paginated transactions
      const paginatedWallet = {
        ...wallet._doc,
        transactions: paginatedTransactions
      };
  
      res.render('wallet', {
        wallet: paginatedWallet,
        currentPage: page,
        totalPages,
        perPage,
        sortField,
        sortOrder
      });
    } catch (error) {
      console.log('loadWallet Error:', error.message);
      res.status(500).render('error', { message: 'Internal Server Error' });
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
    resendOtp,
    loaduserProfile,
    editProfile,
    addaddress ,
    loadaddaddress,
    loadeditAddress,
    editAddress,
    deleteAddress,
    loadShop ,
    cancelorder,
    loadForgotPassword,
    passwordReset ,
    loadpasswordReset,
    loadForgotPasswordemail ,
    addToWallet,
    returnOrder ,
    newArrivals,
    invoice,
    googleSignUp,
    loadwallet
}