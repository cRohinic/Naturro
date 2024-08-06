const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const noCache = require("nocache");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const dotenv = require('dotenv');

dotenv.config();

// MongoDB connection
mongoose.connect('mongodb+srv://rohinic699:EPsSRd9AloW4QQoU@cluster0.pnpqshj.mongodb.net/Natuuro')
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Express app setup
const app = express();
app.use(noCache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware setup
app.use(session({
  secret: 'gshsgschhdscgdscjhscdhjgdschg',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// For cookie
app.use(cookieParser());

require('./auth');

function isLoggedin(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

// Google authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', {
    successRedirect: '/googleSignUp',
    failureRedirect: '/auth/google/failure'
  })
);

app.get('/auth/google/failure', (req, res) => {
  res.redirect('/login');
});

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
