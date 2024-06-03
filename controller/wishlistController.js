const productModel = require('../models/productModel');
const User = require('../models/userModel');
const cartModel = require('../models/cartModel');
const wishlistModel = require('../models/wishlistModel');
const { Long } = require('mongodb');




const loadwishlist = async(req,res)=>{
    try{


        console.log("nnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn")
        let wishlist = await wishlistModel.findOne({ user:req.session.user }).populate({path:"product",model:"Products"});
        console.log(wishlist,"wishlist");
        if (!wishlist) {
            wishlist = null;
        }
        res.render('wishlist', { wish: wishlist });
    } catch (error) {
        console.log(error.message);
    }
};


const addToWishlist = async (req, res) => {
    try {
        const productId = req.query.id;
        const userId = req.session.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        let wishlist = await wishlistModel.findOne({ user: user._id });
        if (!wishlist) {
            wishlist = new wishlistModel({
                user: user._id,
                product: [productId] // Storing products as an array
            });
        } else {
            // Check if the product already exists in the wishlist
            if (wishlist.product.includes(productId)) {
                return res.status(400).send('Product already exists in wishlist');
            }
            
            wishlist.product.push(productId);
        }

        await wishlist.save();
        
        // Sending response indicating success
        res.status(200).send('Product added to wishlist successfully.');

        // Logging success message
        console.log("Product added successfully");

    } catch (err) {
        console.error('addToWishlist:', err.message);
        res.status(500).send('Internal Server Error');
    }
};



const removeWishlist = async (req, res) => {
    try {
        const productId = req.query.id; 
        const userId = req.session.user;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).send('User not found.');
        }

        let wishlist = await wishlistModel.findOne({ user: user._id });

        if (!wishlist) {
            return res.status(404).send('Wishlist not found.');
        }

        const index = wishlist.product.findIndex(productIdInWishlist => productIdInWishlist.toString() === productId);

        if (index === -1) {
            return res.status(404).send('Product not found in wishlist.');
        }

        wishlist.product.splice(index, 1);

        await wishlist.save();
        res.status(200).send('Product removed from wishlist successfully.');
    } catch (error) {
        console.error('Error removing product from wishlist:', error.message);
        res.status(500).send('Internal server error.');
    }
};

module.exports = {
    loadwishlist,
    addToWishlist,
    removeWishlist

}
