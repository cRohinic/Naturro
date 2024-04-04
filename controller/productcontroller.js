const productModel = require("../models/productModel");
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');


const loadProduct = async(req,res)=>{
    try{
        const productdetails = await productModel.find({}).populate('category');
        const categorydetails = await categoryModel.find({});
        res.render('addProduct',{product:productdetails,category:categorydetails,message:null});

    }catch(error){
        console.log('load product',error.message);
    }
};


const addProduct = async(req,res)=>{
    try{
       
        const images = req.files?req.files.map(file=> file.filename) :[] ;
        const product = new productModel({
            name:req.body.name,
            description :req.body.description,
            images:images,
            countInStock:req.body.stock,
            category: req.body.category,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
        });

        const savedProduct = await product.save();
        
        const categoryDetails = await categoryModel.find();
        if(savedProduct){
            res.redirect('/admin/product');
        }else{
            res.render('addProduct',{cate:categoryDetails,message:"Error Saaving Product"});
        }
        }catch(error){
            console.error('Error saving product:',error);

            res.status(500).send('Error saving product');
        }


    };




    const activeStatus = async (req,res)=>{
        try{
            const {id} = req.query;
            console.log('hi');
            
                const product=await productModel.findByIdAndUpdate({_id:id},{is_deleted:true});
            if(product.is_deleted){
                product.is_deleted=false;
            }else{
                product.is_deleted=true;
            }
            await product.save();
            
            res.redirect('/admin/product');
        }
        catch(error){
            console.log(error.message);
        }
    }



    const loadEdit =  async(req,res)=>{
        try{
            const id = req.query.id;


            const proData = await productModel.findById(id);


            const cateData =  await categoryModel.find({});

            res.render("editProduct",{cateData,proData});
        }catch(error){
            console.log(error.message);
            res.status(500).send('Internal Server is Error');
        }
    };



const editProduct = async(req,res)=>{
    try{
        let existingImages = [];
        const existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find();

        if(existingProduct && existingProduct.images && Array.isArray(existingProduct.images)){
            existingImages = existingProduct.images;
        }

        console.log('..........',req.body);
        let newImages = [];
        if(req.files && req.files.length){
            newImages = req.files.map(file => file.filename);
        }

        const allImages = existingImages.concat(newImages);


        if(allImages.length > 3){
            return res.render('editProduct',{cate: categorydetails,pro:existingProduct, message:'maximun 3 inmages per product'});

        }else{
            const updateProduct = await productModel.findByIdAndUpdate(req.query.id,{
                $set:{
                    name:req.body.name,
                    description: req.body.description,
                    images:allImages,
                    caategory:req.body.category,
                    price:req.body.price,
                    descountPrice:req.body.discountPrice,
                    countInStock:req.body.stock,
                }
            }, {new:true});
            if(updateProduct){
                return res.redirect('/admin/product');
            }
        }
    }catch(error){
        console.log('update product:',error.message);
        res.status(500).send('An error ocurred');
    }
};



const loadIndividualProduct = async (req, res) => {
    try {

        const id = req.query.id;
        console.log(req.query.id);
        const productData = await productModel.findById({ _id: id}).populate('category');
        const relatedProducts = await productModel.find({ category: productData.category }).limit(5);
        console.log(relatedProducts,"relatedproduct");
        console.log(productData,'pdt.............');
        const categoryData = await categoryModel.find({});
        console.log(categoryData,'category................');
        const category = categoryData.find(cat => cat._id.equals(productData.category._id));
        if (productData) {
            res.render('productDetails', {
                product: productData,
                category:category.name,relatedProducts
            })
        }
        else {
            res.redirect('/home')
        }
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}




const deleteProduct = async (req, res) => {
    try {
        console.log("deleted");
        const id = req.query.id;
        console.log(req.query.id);
        await product.findByIdAndUpdate(id, { is_active: false });
        res.redirect('/admin/products/Edit');
    } catch (error) {
        console.log(error.message);
    }
};


  




module.exports = {
    loadProduct,
    addProduct,
    activeStatus,
    loadEdit,
    editProduct,
    loadIndividualProduct,
    deleteProduct
}