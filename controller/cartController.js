const productModel = require("../models/productModel");
const User = require("../models/userModel");
const cartModel = require("../models/cartModel");
const addressModel = require("../models/addressModel");
const {couponModel} = require("../models/couponModel");

const loadAndShowCart = async (req, res) => {
    try {
        const userId = req.session.user
        
        let userCart = await cartModel.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Products' });
        
        const coupon = await couponModel.find();
        
        const eligibleCoupons = coupon.filter(coupon => {
            return userCart.billTotal >= coupon.minimumAmount && userCart.billTotal <= coupon.maximumAmount && coupon.isActive;
        });
        console.log(eligibleCoupons)
        
      
        if (!userCart) {
            userCart = null;
        }
        
        res.render('cart', { cart: userCart, coupon: eligibleCoupons }); 
    } catch (err) {
        console.log('loadAndShowCart:', err.message);
        res.status(500).send('Error loading cart');
    }
}



const addTocart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const product = await productModel.findById(productId);

        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        let userCart = await cartModel.findOne({ owner: req.session.user });
        if (!userCart) {
            userCart = new cartModel({
                owner: req.session.user,
                items: [],
                billTotal: 0,
            });
        }

        const existingCartItem = userCart.items.find(item => item.productId.toString() === productId);

        if (existingCartItem) {
            if (existingCartItem.quantity < product.countInStock && existingCartItem.quantity < 5) {
                existingCartItem.quantity += 1;
                existingCartItem.price = existingCartItem.quantity * (product.price - product.discountPrice);
            } else if (existingCartItem.quantity + 1 > product.countInStock) {
                return res.status(409).json({ message: 'Stock Limit Exceeded', alertType: 'stockMax' });
            } else {
                return res.status(400).json({ message: 'Maximum quantity per person reached', alertType: 'maxQuantity' });
            }
        } else {
            if (product.countInStock < 1) {
                return res.status(409).json({ message: 'Stock Limit Minimum', alertType: 'stockMin' });
            }
            userCart.items.push({
                productId: productId,
                quantity: 1,
                price: product.price - product.discountPrice,
            });
        }

        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0);

        await userCart.save();
        return res.status(200).json({ message: 'Added to cart', alertType: 'success' });
    } catch (err) {
        console.log('Error adding to cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




const updatequantity=async(req,res)=>{
    try {
     
        const userId = req.session.user;

        let cart = await cartModel.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Products' });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const { productId, need } = req.body;
        const cartItem = cart.items.find(item => item.productId._id.toString() === productId);
        if (!cartItem) {
            console.log('Cart item not found in update cart');
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }

        const maxPerPerson = 5;
        if (cartItem.quantity >= maxPerPerson && need !== "sub") {
            return res.status(400).json({ success: false, message: "Maximum quantity per person for this product has been reached" });
        }

        if (need === "sub") {
            cartItem.quantity = Math.max(1, cartItem.quantity - 1);
        } else if (need === "sum") {
            const maxQuantity = Math.min(cartItem.productId.countInStock, maxPerPerson);
            cartItem.quantity = Math.min(cartItem.quantity + 1, maxQuantity);
        } else {
            return res.status(404).json({ success: false, message: "Invalid operation" });
        }

        cartItem.price = cartItem.quantity * (cartItem.productId.price-cartItem.productId.discountPrice);
        cart.billTotal = cart.items.reduce((total, item) => total + (item.quantity * (item.productId.price-item.productId.discountPrice)), 0);

        await cart.save();
        return res.status(200).json({ success: true, cart });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}








const deleteCart = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const userId = user._id;
        const { productId } = req.body;

        // Find the user's cart
        let userCart = await cartModel.findOne({ owner: userId }).populate({ path: 'items.productId', model: 'Products' });
        if (!userCart) {
            // Handle the case where there's no cart found for the user
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find if the product exists in the cart
        const existingCartItemIndex = userCart.items.findIndex(item => {
            console.log(item.productId._id ,productId);
            return item.productId._id.toString() === productId
        });
       
        if (existingCartItemIndex > -1) {
            // Remove the item from the cart
            userCart.items.splice(existingCartItemIndex, 1);

            // Recalculate the billTotal
            userCart.billTotal = userCart.items.reduce((total, item) => total + (item.quantity * (item.productId.price-item.productId.discountPrice)), 0);
            // Save the updated cart
            await userCart.save();
            return res.status(200).json({ success: true, message: 'Item removed from cart' });
        } else {
            // Handle the case where the item is not found in the cart
            return res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (err) {
        console.error('Error deleting from cart:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};




module.exports = {
    loadAndShowCart,
    addTocart,
    updatequantity,
    deleteCart
}