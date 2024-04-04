const isLogin = async(req,res,next)=>{
    try{
        if(req.session.user){
            next();
        }else{
            res.redirect('/');
        }
    }catch(error){
        console.log(error.message);
        res.status(500).send('Interval Server Error');
    }
}

const isLogout = async(req,res,next)=>{
    try{
        if(req.session.user){
            res.redirect('/home')
        }else{
            next();
        }
    }
    catch(error){
        console.log(error.message);
    }
}


const checkAuth = (req,res,next)=>{
    if(req.session.user){
        next();
    }else{
        res.redirect('/login');
    }
};

module.exports = {
    isLogin,
    isLogout,
    checkAuth
}