const mongoose = require("mongoose");
const express = require("express");
const session = require("express-session");
const noCache = require("nocache");
const path = require("path");

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/Natuuro", { useNewUrlParser: true, useUnifiedTopology: true })
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
