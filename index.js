const mongoose = require("mongoose");

const session = require("express-session");
const noCache = require("nocache");
mongoose.connect("mongodb://127.0.0.1:27017/Natuuro");
const path=require('path')


const express = require("express");
const app = express();

//session middleware setup

app.use(session({
    secret:'gshsgschhdscgdscjhscdhjgdschg',
    resave:false,
    saveUninitialized:false
}));


//for user routes

const userRoute = require('./routes/userRoutes');
const adminRoute = require('./routes/adminRoute');
app.use('/',userRoute);
app.use('/admin',adminRoute);
app.use(noCache());
app.use('/',express.static(path.join(__dirname,'public')))
app.use("/admin", express.static(path.join(__dirname, "public")));
app.use('/uploads',express.static(path.join(__dirname, 'uploads')))


app.listen(3040,function(){
    console.log("server is running...http://localhost:3040/");
})