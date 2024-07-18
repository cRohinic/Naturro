

const categoryModel =  require("../models/categoryModel");
const bcrypt = require('bcrypt');

const loadCategory=async(req,res)=>{
    try{
        const category = await categoryModel.find({});
        console.log(category);

        res.render('category',{category});
    }catch(error){
        console.log(error.message);
    }

}






const createCategory = async(req,res)=>{
    try{
        const name = req.body.name;
        const dis = req.body.description;
        const existingcate = await categoryModel.findOne({
            name: name.toLowerCase(),
        });


        if(existingcate){
            const categorydetails = await categoryModel.find();
            res.render('category',{category:categorydetails,message:'name is already entered'})
        }
        else{
            const cat = new categoryModel({
                name:name.toLowerCase(),
                description: dis
            });
             await cat.save();

            res.redirect('/admin/category');
        }
    }catch(error){
        console.log(error.message);
        res.status(500).json({status:false,error:"Internal Server error"});
    }
};



const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id;
        const category = await categoryModel.findById(id);

        if (category) {
            
            res.render('edit-cate', { category: category });
            
        } else {
            
            res.redirect('/admin/category');
        }
    } catch (error) {
        
        console.log(error.message);
        
        res.status(500).send('Internal Server Error');
    }

};




const updateCate = async(req,res)=>{

    try{
        console.log(req.query.id,req.body.name,req.body.description);
        await categoryModel.findByIdAndUpdate({_id:req.query.id},{$set:{name:req.body.name,description:req.body.description}});
        
            res.redirect('/admin/category');
    }
    catch(error){
        console.log(error.message);
    }
};



const deleteCate = async(req,res)=>{
    try{
        
        const id = req.query.id;
        const category=await categoryModel.findById(id);
        if(category.is_active){
           category.is_active=false;
        }else{
            category.is_active=true;
        }
        await category.save();
        
        res.redirect('/admin/category');
    }catch(error){
        console.log(error.message);
    }
};



module.exports = {
    createCategory,
    editCategoryLoad,
    updateCate,
    deleteCate,
    loadCategory
};