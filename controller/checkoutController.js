const productModel = require("../models/productModel");
const User = require("../models/userModel");
const cartModel = require("../models/cartModel");
const addressModel = require("../models/addressModel");
 const orderModel = require("../models/orderModel")
const randomstring = require("randomstring");
const razorpay=require('razorpay')
const Wallet = require('../models/walletModel');
var instance = new razorpay({
    key_id: 'rzp_test_V59oBpkY2QETZI',
    key_secret: 'GtMFeNLoY2TwkFdis5LoaQFz',
  });

// key_id,key_secret
// rzp_test_V59oBpkY2QETZI,GtMFeNLoY2TwkFdis5LoaQFz


const loadcheckout =async(req,res)=>{
    try{
        let address = await addressModel.findOne({
          user: req.session.user
        }) || null;
        // const order=await orderModel.findOne({
        //   user: req.session.user
        // }) || null;
        const cart=await cartModel.findOne({
          owner: req.session.user
        }).populate({path:'items.productId', model:'Products'}) || null;
        console.log(cart);
        const user=await User.findById(req.session.user);
        res.render('checkout',{user,address,cart});
    }
    catch(error){
      console.log('loadcheckout',error.message);
    }
  
  };



  const Postcheckout = async (req, res) => {
    try {
        const paymentOption = req.body.paymentOption;
        const address = req.body.addressType ;
        if (!paymentOption) {
            return res.status(400);
        }
        
        if (!address) {
            return res.status(400);
        }

        const user = await User.findById(req.session.user);
        const cart = await cartModel.findOne({ owner: user._id }).populate({ path: 'items.productId', model: 'Products' });
        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }
        if (paymentOption === 'wallet') {
            
                const wallet = await Wallet.findOne({ user:user._id });
        
                if (!wallet) {
                    return res.status(404).json({ message: 'Wallet not found' });
                }
        
                if (wallet.balance < cart.billTotal) {
                    console.log('Insufficient balance');
                    return res.status(400).json({ message: 'Wallet does not have enough money' });
                }
        
                wallet.balance -= cart.billTotal;
                wallet.transactions.push({
                    amount: cart.billTotal,
                    type: 'debit',
                    reason: 'order using wallet'
                });
                await wallet.save();
        
        
        
        }
        
        const OrderAddress = await addressModel.findOne({ user: user._id });
        if (!OrderAddress) {
            return res.status(400).json({ message: "Address not found" });
        }

        const addressdetails = OrderAddress.addresses.find(
            (item) => item.addressType === address
        );
        if (!addressdetails) {
            return res.status(400).json({ message: "Invalid address ID" });
        }

        const selectedItems = cart.items;

        for (const item of selectedItems) {
            const product = await productModel.findOne({ _id: item.productId });

            if (product.countInStock === 0) {
                return res.status(400).json({ message: "product Out of stock" });
            }
            if (product) {
                if (product.countInStock >= item.quantity) {
                    product.countInStock -= item.quantity;
                    // product.popularity++;

                    await product.save();
                }
            } else {
                console.log('Product not found');
            }
        }

        const order_id = await generateUniqueOrderID();

        const orderData = new orderModel({
            user: user._id,
            cart: cart._id,
            billTotal: cart.billTotal,
            oId: order_id,
            paymentStatus: "Success",
            paymentMethod: paymentOption,
            deliveryAddress: addressdetails,
            coupon: cart.coupon,
            discountPrice: cart.discountPrice
        });

        for (const item of selectedItems) {
            orderData.items.push({
                productId: item.productId._id,
                image: item.productId.images[0],
                name: item.productId.name,
                productPrice: item.productId.price-item.productId.discountPrice,
                quantity: item.quantity,
                price: (item.productId.price-item.productId.discountPrice)*item.quantity
            })
        }

        await orderData.save();

        cart.items = [];
        cart.billTotal = 0;
        await cart.save();

        res.status(200).json({order_id});

    } catch (error) {
        console.log('Post checkout error:', error.message);
        res.status(500).json({ message: "Internal server error" });
        res.redirect('/home');
    }
};



async function generateUniqueOrderID() {

    const randomPart= randomstring.generate({
        length: 6,
        charset: 'numeric',
      });
   
  
  
    const currentDate = new Date();
  
    
    const datePart = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
  
   
    const orderID = `ID_${randomPart}${datePart}`;
  
    return orderID;
  }



  const loadorderconfirmed = async (req, res) => {
  
    try {
        let product=await  orderModel.find({list:true})
        const perPage=8;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await orderModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage);
        const orderId = req.query.id;
        console.log(orderId);
        const order = await orderModel.findOne({oId:orderId}).skip(perPage * (page-1)).limit(perPage).sort({_id:-1});
       
        if (!order) {
           
            return res.status(404);
        }
       
        res.render('orderconfirmed', { order: order }); // Ensure you have an 'orderConfirmed.ejs' view in your views directory
    } catch (error) {
        console.error("Error retrieving order:", error);
        // Handle any other errors, such as database connection issues
        res.status(500).render('errorPage', { message: "An error occurred while retrieving the order." });
    }
};



const loadorderdetails = async (req, res) => {
    try {
        const orderId = req.query.id
        // let address = await addressModel.findOne({ user: req.session.user }) || null;
        const order = await orderModel.findOne({ _id:orderId }) ;
        // const user = await User.findById(req.session.user);
  
        console.log(order);
  
        res.render('orderdetails', { order });
    } catch (error) {
        console.log('loadorderdetails Error:', error.message);
    }
  };


  const razorpayVerify = async (req, res) => {
    try {
        const address = req.body.address || 'home';

        const user = await User.findById(req.session.user);
        const cart = await cartModel.findOne({ owner: user._id }).populate({ path: 'items.productId', model: 'Products' });

        if (!cart) {
            return res.status(400).json({ message: "Cart not found" });
        }

        const OrderAddress = await addressModel.findOne({ user: user._id });

        if (!OrderAddress) {
            return res.status(400).json({ message: "Address not found" });
        }

        const addressdetails = OrderAddress.addresses.find(item => item.addressType === address);

        if (!addressdetails) {

        }

        const secretKey = 'GtMFeNLoY2TwkFdis5LoaQFz';

        let expectedSignature = crypto.createHmac("sha256", secretKey)

        expectedSignature.update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id)
        expectedSignature = expectedSignature.digest("hex");


        const selectedItems = cart.items;

        // if (expectedSignature === req.body.razorpay_signature) {
        const orderData = new orderModel({
            user: user._id,

            billTotal: cart.billTotal,
            oId: req.body.razorpay_order_id,
            paymentStatus: "Success",
            paymentMethod: 'razorpay',
            deliveryAddress: addressdetails,
            coupon: cart.coupon,
            discountPrice: cart.discountPrice
        });

        for (const item of cart.items) {
            orderData.items.push({
                productId: item.productId._id,
                image: item.productId.images[0],
                name: item.productId.name,
                productPrice: item.productId.price-item.productId.discountPrice,
                quantity: item.quantity,
                price: (item.productId.price-item.productId.discountPrice)*item.quantity
            })
        }

        await orderData.save();

        cart.items = [];
        cart.isApplied = false;
        await cart.save();
        res.json({ success: true, message: "Order processed successfully", orderId: req.body.razorpay_order_id });



    } catch (err) {
        console.log(err.message);
        return res.status(500).send("Internal Server Error");
    }
}
const orderonlineload = async (req, res) => {
  try {
      // Verify the payment with Razorpay (signature validation)
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, selectedAddress } = req.body.paymentData;
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac("sha256", razorpaySecret).update(body).digest("hex");

      if (expectedSignature === razorpay_signature) {
          // Signature validation successful, update order status in database
          const order = await order.findOneAndUpdate({ oId: razorpay_order_id }, { paymentStatus: "Success" }, { new: true });

          // Send a response indicating the success of the payment
          res.json({ success: true, message: "Payment successful", order: order });
      } else {
          // Signature validation failed
          res.status(400).json({ success: false, message: "Invalid signature" });
      }
  } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ success: false, message: "An error occurred while processing the payment" });
  }
};





const razorpayFn=async (req,res)=>{
  console.log('enterd in the fn');
  const {addressType,paymentOption}=req.body.data

  const cartData=await cartModel.findOne({owner:req.session.user})
  const address=await addressModel.findOne({user:req.session.user})
  console.log(address);

  let arr=address.addresses.filter((ad)=>{
    return ad.addressType===addressType
  })
  console.log(arr);
 

  // console.log(arr);
  // const address = await addressModel.findOne({
  //     user: user,
  //    'addresses._id': a_id
  // },{
  //     'addresses.$': 1 // Use the positional $ operator to fetch only the matching address
  // })
  // console.log(address,'got address');
  const cart=await cartModel.findById(cartData._id).populate('items.productId')
  console.log(cart);
  const order_id = await generateUniqueOrderID();

  // console.log(process.env.rzId,"zzzz",cart.billTotal,"cart bill");

  const url=`orderconfirmed?id=${order_id}`
  // var instance = new razorpay({ key_id: process.env.rzKey, key_secret: process.env.rzId })
  var options = {
      amount: cart.billTotal*100,
      currency: "INR",
      receipt: ''+order_id,
      };
      console.log(options);

  const order = await new Promise((resolve, reject) => {
      instance.orders.create(options, function (err, order) {
          if (err) {
              reject(err);
          } else {
              resolve(order);
          }
      });
  });

  console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

          
          console.log(order)
     

console.log(arr[0],'delivvvvvvveeeeeeeeeerrrrrrrrrr');

          const orderData = new orderModel({
              user: req.session.user,
              oId: order_id,
              deliveryAddress:arr[0],
              billTotal:cart.billTotal,
              // paymentStatus: "Pending",
              paymentMethod: paymentOption,
              coupon: cart.coupon,
              discountPrice: cart.discountPrice
          });
          
          for (const item of cart.items) {
            console.log(item);
              orderData.items.push({
                  productId: item.productId._id,
                  image: item.productId.images[0],
                  name: item.productId.name,
                  productPrice: item.productId.price-item.productId.discountPrice,
                  quantity: item.quantity,
                  price: (item.productId.price-item.productId.discountPrice)*item.quantity
              })
          }

          await orderData.save();
          console.log("!!!!!",orderData,'order data');
          req.session.orderId = orderData._id;
           // Update stock levels
          for (const item of cart.items) {
              const product = await productModel.findOne({ _id: item.productId });
              product.countInStock -= item.quantity;
              await product.save();
          }

          // Clear the cart
          cart.items = [];
          await cart.save();
          const resurl = orderData._id;
          console.log("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
        //   console.log(order)
        //   console.log(resurl)
          res.json({order,resurl})
}




const payment = async(req,res)=>{
  try{
   
      const id = req.session.orderId;
      const order = await orderModel.findOne({_id:id}).populate({ path: 'items.productId', model: 'Products' } );
      console.log(order,"order");
      const razor = req.query.razor;
      console.log(order,"order before saving");
      order.payId = razor;
      await order.save();
      console.log(order,"order after saving");
      res.render('orderconfirmed',{order});
  }catch(error){
      console.log(error.message);
  }
}

const Instance = new razorpay({
  key_id: 'rzp_test_V59oBpkY2QETZI',
  key_secret: 'GtMFeNLoY2TwkFdis5LoaQFz',

});



const revisePayment = async (req, res) => {
    try {
      
      const orderId = req.body.orderId;
      const orders = await orderModel.findOne({ oId: orderId });
  
      if (!orders) {
        return res.status(404).json({ message: "Order not found" });
      }
  
     
      const amount = orders.billTotal * 100;
  
     
      const receipt = await generateUniqueOrderID(); 
      const order = await instance.orders.create({
        amount,
        currency: "INR",
        receipt,
      });
  
      console.log("Razorpay order created:", order); 
      orders.paymentStatus='Success';
      await orders.save();
      res.json({ order });
    } catch (error) {
      console.error("Error during payment retry:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
  

const failedPayment = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        console.log(orderId,'failed payment');
        const orders = await orderModel.findById(orderId);
    
        if (!orders) {
          return res.status(404).json({ message: "Order not found" });
        }

        orders.paymentStatus='Pending';
        await orders.save();
        res.status(200).json({ orderId});
    } catch (error) {
        console.error('Failed Payment:', error);
        return res.status(500).json({ success: false, message: "Failed to process order. Please try again later" });
    }
  };
const orderCancelled=async(req,res)=>{
    try {
        const id=req.query.id;
        const order=await orderModel.findById(id)
        res.render('ordercancelled',{order})
    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {

    loadcheckout,
    Postcheckout,
    generateUniqueOrderID,
    loadorderconfirmed ,
    loadorderdetails,
    razorpayVerify,
    orderonlineload ,
    razorpayFn,
    payment,
    revisePayment,
    failedPayment,
    orderCancelled
}