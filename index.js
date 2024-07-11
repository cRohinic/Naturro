const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const noCache = require("nocache");
const path = require("path"); 
const passport = require("passport");
const cookieParser = require("cookie-parser");
const bcrypt=require('bcrypt')
require('./auth')
 const dotenv=require('dotenv')
 dotenv.config()
// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Express app setup
const app = express();
app.use(noCache());


// Session middleware setup


app.use(session({
  secret: 'gshsgschhdscgdscjhscdhjgdschg',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


function isLoggedin(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// For cookie
app.use(cookieParser());

app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
      successRedirect: '/googleSignUp',
      failureRedirect: '/authenticationn/google/failure'
  })
);

app.get('/auth/google/failure', isLoggedin, (req, res) => {
  console.log(session.user);
  res.redirect('/login');
})


// Static file serving
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const userRoute = require('./routes/userRoutes');
const adminRoute = require('./routes/adminRoute');
app.use('/', userRoute);
app.use('/admin', adminRoute);

// Start the server
const PORT = 3040;
app.listen(PORT, () => {
  console.log(`Server is running...http://localhost:${PORT}/`);
});
