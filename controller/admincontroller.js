const user = require("../models/userModel");
const bcrypt = require('bcrypt');

const categoryModel = require("../models/categoryModel");



const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}



const verifyAdmin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
       
        const userData = await user.findOne({ email: email });
        
        if (userData) {
            const passwordMatch = await bcrypt.compare(password, userData.password);
            
            if (passwordMatch) {
                if (userData.is_admin === 1) { 
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                } else {
                    res.render('login', { message: 'You are not authorized to access this page.' });
                }
            } else {
                res.render('login', { message: 'Incorrect email or password.' });
            }
        } else {
            res.render('login', { message: 'Incorrect email or password.' });
        }
    } catch (error) {
        console.error('Error in verifyAdmin:', error);
        res.status(500).send('Internal Server Error');
    }
}


const loadDashboard = async (req,res)=>{
    try{
        
        res.render('adminhome');

    }
    catch(error){
        console.log('load home',error.message);
    }
}



const logout = async(req,res)=>{
    try{
        req.session.user_id = false;
        res.redirect('/admin');
    }catch(error){
        console.log(error.message);
    }
}


const blockUser = async(req,res)=>{
    try{
        const id = req.query.id;
        const userData = await user.findById(id);

        if(userData){
            userData.is_blocked =true;
            await userData.save();


            res.redirect('/admin/userlist');
        }
    }catch(error){
        console.log(error.message);
        res.status(500).send('Internal Server is Error')
    }
};



const unblockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await user.findById(id);
  
        if (userData) {
            
            userData.is_blocked = false;
            await userData.save();
          console.log("123");
            
            res.redirect('/admin/userlist');
        } else {
            
            res.status(404).send('User not found');
            console.log("456");
  
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
        console.log("789");
    }
  };




const loadCategory = async(req,res)=>{
    try{
        const category = await categoryModel.find({});
        console.log(category);

        res.render('category',{category});
    }catch(error){
        console.log(error.message);
    }
}


const listUser = async(req,res)=>{
    try{
        const userData = await user.find({is_admin:0});
        console.log(userData);
        res.render('userlist',{users:userData});
    }catch(error){
        console.log(error.message);
    }
}




module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard,
    logout,
    blockUser,
    unblockUser,
    loadCategory,
    listUser
}