const productModel = require("../models/productModel");
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const ProductModel = require("../models/productModel");
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');



const loadProduct = async(req,res)=>{
    try{
        let product=await ProductModel.find({list:true})
        const perPage=3;
            const page = parseInt(req.query.page) || 1;
            const totalproducts= await ProductModel.countDocuments({});
            const totalPage=Math.ceil(totalproducts / perPage);
        const productdetails = await productModel.find({}).populate('category').skip(perPage * (page-1)).limit(perPage).sort({_id:-1});
        const categorydetails = await categoryModel.find({});
        res.render('addProduct',{product:productdetails,category:categorydetails,message:null});

    }catch(error){
        console.log('load product',error.message);
    }
};


// const addProduct = async(req,res)=>{
//     try{
       
//         const images = req.files?req.files.map(file=> file.filename) :[] ;
//         const product = new productModel({
//             name:req.body.name,
//             description :req.body.description,
//             images:images,
//             countInStock:req.body.stock,
//             category: req.body.category,
//             price: req.body.price,
//             discountPrice: req.body.discountPrice,
//         });

//         const savedProduct = await product.save();
        
        
        
//         const categoryDetails = await categoryModel.find();
//         if(savedProduct){
//             res.redirect('/admin/product');
//         }else{
//             res.render('addProduct',{cate:categoryDetails,message:"Error Saaving Product"});
//         }
//         }catch(error){
//             console.error('Error saving product:',error);

//             res.status(500).send('Error saving product');
//         }


//     };

// 

const addProduct = async (req, res) => {
    try {
        const images = [];
        const outputDirectory = path.join(__dirname, '/uploads'); // Replace with your actual public directory

        // Ensure the output directory exists
        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }

        if (req.files) {
            for (const file of req.files) {
                const inputPath = file.path; // Assuming multer saves files in `req.files` with a `path` property
                const outputFilename = `resized-${file.filename}`;
                const outputPath = path.join(outputDirectory, outputFilename);

                // Use Sharp to resize the image
                await sharp(inputPath)
                    .resize(1000, 1000) 
                    .toFile(outputPath);

                // Store the relative path to the image
                images.push(`/images/${outputFilename}`);
            }
        }

        const product = new productModel({
            name: req.body.name,
            description: req.body.description,
            images: images,
            countInStock: req.body.stock,
            category: req.body.category,
            price: req.body.price,
            discountPrice: req.body.discountPrice,
        });

        const savedProduct = await product.save();

        const categoryDetails = await categoryModel.find();
        if (savedProduct) {
            res.redirect('/admin/product');
        } else {
            res.render('addProduct', { cate: categoryDetails, message: "Error Saving Product" });
        }
    } catch (error) {
        console.error('Error saving product:', error);
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
            const  proData = await productModel.findById(id);


            const cateData =  await categoryModel.find({});

            res.render("editProduct",{cateData, proData});
        }catch(error){
            console.log(error.message);
            res.status(500).send('Internal Server is Error');
        }
    };


    const deleteimage = async (req, res) => {
        try {
            const id = req.query.id;
            const del = req.query.delete;
    
            const product = await productModel.findById(id);
            console.log(product, del, id);
    
            if (del) {
                const index = product.images.indexOf(del);
                if (index !== -1) {
                    product.images.splice(index, 1);
                    // Save the updated product to the database
                    await product.save();
                }
            }
    
            res.redirect('/admin/editproduct?id=' + id);
        } catch (err) {
            console.log(err.message);
            // Handle errors appropriately, perhaps send an error response
            res.status(500).send("Error deleting image");
        }
    }
    
const editProduct = async(req,res)=>{
    try{
        let existingImages = [];
        const existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find();

        if(existingProduct && existingProduct.images && Array.isArray(existingProduct.images)){
            existingImages = existingProduct.images;
        }

        // console.log('..........',req.body);
        let newImages = [];
        if(req.files && req.files.length){
            newImages = req.files.map(file => file.filename);
        }
        // console.log(newImages,"newi");

        const allImages = existingImages.concat(newImages);
        // console.log(allImages,"all images");


        if(allImages.length > 5){
            return res.render('editProduct',{cateData: categorydetails, proData:existingProduct, message:'maximun 3 inmages per product'});

        }else{
            const updateProduct = await productModel.findByIdAndUpdate(req.query.id,{
                $set:{
                    name:req.body.name,
                    description: req.body.description,
                    images:allImages,
                    category:req.body.category,
                    price:req.body.price,
                    discountPrice:req.body.discountPrice,
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
        const perPage=8;
        const page = parseInt(req.query.page) || 1;
        const totalproducts= await productModel.countDocuments({});
        const totalPage=Math.ceil(totalproducts / perPage);
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

const updatepro = async (req, res) => {
    try {

        let existingImages = [];
        const existingProduct = await productModel.findById(req.query.id);
        const categorydetails = await categoryModel.find({});

        if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images) ) {
            existingImages = existingProduct.images;
        }

        let newImages = [];
        if (req.files && Array.isArray(req.files)) {
            newImages = req.files.map(file => file.filename);
        }


        const allImages = existingImages.concat(newImages);
        if(allImages.length>3){
            res.render('admin-product-edit', { cateData: categorydetails,  proData: existingProduct, message: 'maximum 3 images per product' });
        }else{
            
            const category=await categoryModel.findById(req.body.category) || null;
        
            if(category !==null && typeof category.offerTime!=='undefined'  )
            {
               
                await productModel.findByIdAndUpdate(req.query.id, {
                    $set: {
                        name: req.body.name,
                        description: req.body.description,
                        images: allImages,
                        brand: req.body.brand,
                        category: req.body.category,
                        price: req.body.price,
                        countInStock:req.body.stock,
                        offerTime:category.offerTime,
                        discountPrice:category.discountPrice
        
                    }});
       }else{
        await productModel.findByIdAndUpdate(req.query.id, {
            $set: {
                name: req.body.name,
                description: req.body.description,
                images: allImages,
                brand: req.body.brand,
                category: req.body.category,
                price: req.body.price,
                countInStock: req.body.stock,
                discountPrice:category.discountPrice
            },
            $unset: {
                offerTime: "",
                discountPrice: ""
            }
        });
        
            
    }
        
    res.redirect('/admin/productlist');


    }}
             catch (error) {
              console.log('update product:', error.message);
   }
};

const showsearch = async (req, res) => {
    try {
        const search = req.query.text;
        const categoryQuery = req.query.category;
        let products = [];

        if (categoryQuery) {
            const category = await categoryModel.findOne({ name: categoryQuery });

            if (category) {
                products = await productModel.find({
                    category: category._id,
                    list: true,
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { brand: { $regex: search, $options: 'i' } }
                    ]
                }).populate('category');
            } else {
                return res.status(404).json({ error: 'Category not found' });
            }
        } else {
            products = await productModel.find({
                is_deleted: false,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } }
                ]
            }).populate('category');
        }

        res.status(200).json({ products: products });
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};






module.exports = {
    loadProduct,
    addProduct,
    activeStatus,
    loadEdit,
    editProduct,
    loadIndividualProduct,
    updatepro,
    deleteimage,
    showsearch
}