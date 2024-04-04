const mongoose = require('mongoose');
const  productSchema = new mongoose.Schema({


    name :{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
    images:[{
        type:String
    }],
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'category',
        required:true
    },
    price:{
        type:Number,
        required:true,
        default:0
    },

    discountPrice:{
        type:Number,
        default:0
    },
    countInStock:{
        type:Number,
        required:true,
        min:0,
        max:100
    },
    rating:{
        type:Number,
        default:0
    },
    isFeatured:{
        type:Boolean,
        defualt:true
    },
   
    is_deleted:{
        type:Boolean,
        default:true
    }
});

const ProductModel = mongoose.model('Products', productSchema )


module.exports = ProductModel;