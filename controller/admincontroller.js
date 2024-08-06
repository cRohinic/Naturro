const user = require("../models/userModel");
const bcrypt = require('bcrypt');
const ExcelJS=require('exceljs')
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel")
const productModel=require('../models/productModel');
const walletModel= require('../models/walletModel');
const userModel = require("../models/userModel");
const ProductModel = require("../models/productModel");
const PDFDocument = require('pdfkit');


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
        console.log('ysssss',userData);
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

async function salesReport(date){
  try{
      const currentDate = new Date();
      let orders = [];
      for (let i = 0; i < date; i++) {
          const startDate = new Date(currentDate);
          startDate.setDate(currentDate.getDate() - i);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(currentDate);
          endDate.setDate(currentDate.getDate() - i);
          endDate.setHours(23, 59, 59, 999);  
      
          const dailyOrders = await orderModel.find({
            status: "Delivered",
            orderDate: {
              $gte: startDate,
              $lt: endDate,
            },
          });
          
      
          orders = [...orders, ...dailyOrders];
        }
  
        let productEntered = [];
        for (let i = 0; i < date; i++) {
            const startDate = new Date(currentDate);
            startDate.setDate(currentDate.getDate() - i);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(currentDate);
            endDate.setDate(currentDate.getDate() - i);
            endDate.setHours(23, 59, 59, 999);  
        
            const product = await productModel.find({
              createdAt: {
                $gte: startDate,
                $lt: endDate,
              },
            });
            
        
            productEntered= [...productEntered, ...product];
          }
        let users = await userModel.countDocuments();
       
  
        let totalRevenue = 0;
        orders.forEach((order) => {
          totalRevenue += order.billTotal;
        });
      
        let totalOrderCount = await orderModel.find({
          status: "Delivered",
        });
      
        let Revenue = 0;
        totalOrderCount.forEach((order) => {
          Revenue += order.billTotal;
        });
      
        let stock = await productModel.find();
        let totalCountInStock = 0;
        stock.forEach((product) => {
          totalCountInStock += product.countInStock;
        });
      
        let averageSales = orders.length / date; 
        let averageRevenue = totalRevenue / date; 
   
       
        return {
          users,
          totalOrders: orders.length,
          totalRevenue,
          totalOrderCount: totalOrderCount.length,
          totalCountInStock,
          averageSales,
          averageRevenue,
          Revenue,
          productEntered:productEntered.length,
         
          totalOrder:orders
        };
  }
  catch(err){
  console.log('salesreport',err.message);
  }
  }
  async function orderPieChart() {
    try {
      const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Canceled", "Returned"];
      const counts = await Promise.all(statuses.map(status => orderModel.countDocuments({ status })));
      
      const [Pending, Processing, Shipped, Delivered, Canceled, Returned] = counts;
      return { Pending, Processing, Shipped, Delivered, Canceled, Returned };
    } catch (err) {
      console.error('orderPieChart', err.message);
    }
  }
  
  async function salesReportmw(startDate, endDate) {
      try {
          let orders = await orderModel.find({
              status: "Delivered",
              orderDate: {
                  $gte: startDate,
                  $lte: endDate,
              },
          });
  
          let productEntered = await productModel.find({
              createdAt: {
                  $gte: startDate,
                  $lte: endDate,
              },
          });
  
          let usersCount = await userModel.countDocuments();
  
          let totalRevenue = orders.reduce((total, order) => total + order.billTotal, 0);
  
          let totalOrderCount = orders.length;
  
          let stock = await productModel.find(); 
          let totalCountInStock = stock.reduce((total, product) => total + product.countInStock, 0);
  
          let daysInRange = (endDate - startDate) / (1000 * 60 * 60 * 24);
          let averageSales = totalOrderCount / daysInRange; 
          let averageRevenue = totalRevenue / daysInRange; 
  
          return {
              usersCount,
              totalOrders: totalOrderCount,
              totalRevenue,
              totalCountInStock,
              averageSales,
              averageRevenue,
              productEntered: productEntered.length,
              totalOrder: orders 
          };
      } catch (err) {
          console.error('salesReport error', err.message);
          throw err; 
      }
  }


  const loadDashboard = async (req, res) => {
    try {
      const [daily, weekly, monthly, yearly, allProductsCount, orders, topSellingProducts, topSellingCategories, orderChart] = await Promise.all([
        salesReport(1),
        salesReport(7),
        salesReport(30),
        salesReport(365),
        productModel.countDocuments(),
        orderModel.find().populate('user').limit(5),
        orderModel.aggregate([
          { $match: { status: "Delivered" } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.productId",
              totalQuantity: { $sum: "$items.quantity" },
            },
          },
          { $sort: { totalQuantity: -1 } },
          { $limit: 6 },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "productDetails",
            },
          },
          { $unwind: "$productDetails" },
          {
            $project: {
              _id: "$productDetails._id",
              pname: "$productDetails.pname",
              totalQuantity: 1,
              images: "$productDetails.images",
              brand: "$productDetails.brand",
            },
          },
        ]),
        orderModel.aggregate([
          { $match: { status: "Delivered" } },
          { $unwind: "$items" },
          {
            $lookup: {
              from: "products",
              localField: "items.productId",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $group: {
              _id: "$product.category",
              totalSales: { $sum: "$items.quantity" },
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: "$category" },
          {
            $project: {
              name: "$category.name",
              totalSales: 1,
            },
          },
          { $sort: { totalSales: -1 } },
          { $limit: 5 },
        ]),
        orderPieChart()
      ]);
  
      res.render('adminhome', {
        daily, weekly, monthly, yearly,
        allProductsCount, orders, orderChart,
        topSellingCategories, topSellingProducts
      });
    } catch (error) {
      console.error(error);
    }
  };
  



























// Helper Functions

const getTopSellingProducts = async () => {
  return await orderModel.aggregate([
    { $match: { status: "Delivered" } },
    { $unwind: "$items" },
    { $group: { _id: "$items.productId", totalQuantity: { $sum: "$items.quantity" } } },
    { $sort: { totalQuantity: -1 } },
    { $limit: 6 },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productDetails" } },
    { $unwind: "$productDetails" },
    {
      $project: {
        _id: "$productDetails._id",
        pname: "$productDetails.pname",
        totalQuantity: 1,
        images: "$productDetails.images",
        brand: "$productDetails.brand",
      },
    },
  ]);
};

const getTopSellingCategories = async () => {
  return await orderModel.aggregate([
    { $match: { status: "Delivered" } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "product" } },
    { $unwind: "$product" },
    { $group: { _id: "$product.category", totalSales: { $sum: "$items.quantity" } } },
    { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
    { $unwind: "$category" },
    {
      $project: {
        name: "$category.name",
        totalSales: 1,
      },
    },
    { $sort: { totalSales: -1 } },
    { $limit: 5 },
  ]);
};

const getTopSellingBrands = async () => {
  return await orderModel.aggregate([
    { $match: { status: "Delivered" } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productDetails" } },
    { $unwind: "$productDetails" },
    { $group: { _id: "$productDetails.brand", totalSales: { $sum: "$items.quantity" } } },
    { $sort: { totalSales: -1 } },
    { $limit: 5 },
  ]);
};

const calculateWeeklyEarnings = (orders) => {
  
  const yValues = [0, 0, 0, 0, 0, 0, 0];

  orders.forEach((order) => {
 
    const createdAt = new Date(order.createdAt);
    if (!isNaN(createdAt)) {
 
      const dayOfWeek = createdAt.getDay();

      yValues[dayOfWeek] += order.billTotal;
    }
  });

  return yValues;
};


const calculateSalesByCategory = (orders, categories) => {
  const sales = new Array(categories.length).fill(0);
  const allNames = categories.map((category) => category.name);
  const allIds = categories.map((category) => category._id);

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const productCategory = allIds.findIndex((id) => id.equals(item.productId.category));
      if (productCategory > -1) {
        sales[productCategory] += item.quantity;
      }
    });
  });

  return { allNames, sales };
};

const getMonthlyEarnings = async () => {
  try {
    
    const monthlyEarnings = await orderModel.aggregate([
      { $match: { status: "Delivered" } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%m-%Y", date: "$createdAt" } }, 
          totalEarnings: { $sum: "$billTotal" } 
        } 
      },
      { $sort: { "_id": 1 } },
    ]);

   
    
    const months = [
      "01-2024",
      "02-2024",
      "03-2024",
      "04-2024",
      "05-2024",
    ];

    // Map the monthly earnings to the respective months, returning 0 if no earnings are found for that month
    return months.map((month) => {
      const earnings = monthlyEarnings.find((e) => e._id === month);
      return earnings ? earnings.totalEarnings : 0;
    });
    console.log();
  } catch (error) {
    console.error("Error fetching monthly earnings:", error);
    throw error;
  }
};


const getTotalEarnings = async () => {
  const orders = await orderModel.find({ status: "Delivered" });
  return orders.reduce((sum, order) => sum + order.billTotal, 0);
};

const getDailyEarnings = async () => {
  return await orderModel.aggregate([
    { $match: { status: "Delivered" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalEarnings: { $sum: "$billTotal" } } },
    { $sort: { "_id": 1 } },
  ]);
};


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
        
         const perPage=3;
            const page = parseInt(req.query.page) || 1;
            const totalcate= await categoryModel.countDocuments({});
            const totalPage=Math.ceil(totalcate/ perPage);
       
        const category = await categoryModel.find({}).skip(perPage * (page-1)).limit(perPage).sort({_id:-1});
        res.render('category',{category})
    }catch(error){
        console.log(error.message);
    }
}


const listUser = async(req,res)=>{
    try{
      let product=await userModel.find({list:true})
      const perPage=3;
          const page = parseInt(req.query.page) || 1;
          const totalproducts= await userModel.countDocuments({});
          const totalPage=Math.ceil(totalproducts / perPage);
        const userData = await user.find({is_admin:0}).skip(perPage * (page - 1))
        .limit(perPage);
        console.log(userData);
        res.render('userlist',{users:userData});
    }catch(error){
        console.log(error.message);
    }
}

const loadorder =async(req,res)=>{
    try{
      let product=await orderModel.find({list:true})
      const perPage=8;
          const page = parseInt(req.query.page) || 1;
          const totalproducts= await orderModel.countDocuments({});
          const totalPage=Math.ceil(totalproducts / perPage);
        const order = await orderModel.find({}).populate({path:'user',model:'User'}).skip(perPage * (page -1)).limit(perPage).sort({createdAt:-1});
        res.render('order',{order});
    }catch(error){
      console.log(error.message);
    }
}




const loadorderdetails = async(req,res)=>{
    try{
      const id =req.query.id;
      const orders = await orderModel.findById(id).populate({path:'user',model:'User'});
      res.render('adminorderdetals',{orders});
    }catch(error){
      console.log(error.message);
    }
  }
  const requestAccept = async (req, res) => {
    try {
      const { orderId, userId } = req.body;
  
      const canceledOrder = await orderModel.findOne({ oId: orderId });
      if (!canceledOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
  
      const User = await user.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }


      let wallet = await walletModel.findOne({ user: userId });
      if (!wallet) {
        
          wallet = new walletModel({
              user: userId,
              balance: 0, 
              transactions: [] 
          });
      }
      wallet.balance += canceledOrder.billTotal;
      wallet.transactions.push({
          amount: canceledOrder.billTotal,
          type: 'credit',
          reason: 'Refund for order ' + orderId
      });

      await wallet.save();




  
      // Iterate over each item in the canceled order to update product stock.
      for (const orderItem of canceledOrder.items) {
        let product = await productModel.findById(orderItem.productId).exec();
        console.log('iiiiiiiiiiiiiiiiiii',orderItem.productId,orderItem.quantity);
        console.log(product,'come2');
        if (product) {
          product.countInStock += Number(orderItem.quantity);
          await product.save();
        }
      }
  
      // Process each request in the canceledOrder.
      for (let request of canceledOrder.requests) {
        if (request.status === 'Pending') { // Ensure we're only updating pending requests.
          const newStatus = request.type === 'Cancel' ? 'Canceled' : 'Returned';
          await orderModel.findOneAndUpdate(
            { oId: orderId, 'requests._id': request._id }, // Match the specific request by its ID.
            {
              $set: {
                status: newStatus,
                'requests.$.status': 'Accepted' // Update the matched request status.
              }
            },
            { new: true }
          );
        }
      }
  
      return res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  


  const requestCancel = async(req,res)=>{
    try {
        const { orderId} = req.body;
       
  
            const Order = await orderModel.findOne({oId:orderId});
  
            if (!Order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }
        
        for (const orderItem of Order.items) {
            const product = await productModel.findById(orderItem.productId);
  
            if (product &&product.countInStock>0 ) {
             
                // product.countInStock -= orderItem.quantity;
                await product.save();
            }
        }
    
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: 'Pending', 'requests.$[elem].status': 'Rejected' } },
            { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
        );
        
  
    if (!updatedOrder) {
        
        return res.status(201).json({ success: true, message: 'Order not found' });
        
    }
    
  
    return res.status(200).json({ success: true, message: 'Order status rejected', updatedOrder })
     }catch (error) {
        console.error(error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
  }




  const updateorder=async(req,res)=>{
    try{
        const {newStatus,orderId}=req.body;
       
        const order=await orderModel.findOne({oId:orderId});
        if(newStatus==='Canceled'){
            for (const orderItem of order.items) {
                let product = await productModel.findById(orderItem.productId);
    
  
                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
  
        }
        const updatedOrder = await orderModel.findOneAndUpdate(
            { oId: orderId },
            {$set:{ status: newStatus } },
            { new: true }
        );
          
        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
  
        return res.status(200).json({ success: true, message: 'Order status updated successfully', updatedOrder });
    }
    catch(error){
        console.log('uporder:',error.message);
    }
  
  }


  const offer=async(req,res)=>{
    try{
      
        let product=await productModel.find({is_deleted:false});
        console.log(product);
        const category=await categoryModel.find({is_active:true});
        for (let i = 0; i < product.length; i++) {
            const offerDate = new Date(product[i].offerTime);
            const currentDate=new Date();
          
            if (currentDate > offerDate) {
                product[i].discountPrice = 0;
                product[i].offerTime = null;
            }
    
            await product[i].save();
        }
        for (let i = 0; i < category.length; i++) {
            const offerDate = new Date(category[i].offerTime);
            const currentDate = new Date();
        
            if (currentDate > offerDate) {
                const products = await productModel.find({category: category[i]._id});
        
              
                const updateProductPromises = products.map(async (product) => {
                    product.discountPrice = 0;
                    product.offerTime = null;
                    return product.save();
                });
                
                await Promise.all(updateProductPromises);
        
                await categoryModel.findByIdAndUpdate(category[i]._id, {
                    $unset: { offerTime: "",discountPrice:"" } 
                });
        
           
            }
        }
        console.log(product,category);

    
    res.render('offer',{product,category});
    }
    catch(error){
        console.log('offer',error.message);
    }
}

const categoryoffer=async(req,res)=>{
  try {
      const id = req.query.id;
      const products = await productModel.find({ category: id });
  
      const updateProductPromises = products.map(async (product) => {
          product.discountPrice = 0;
          product.offerTime = null;
          return product.save();
      });
  
      await Promise.all(updateProductPromises);
  
      await categoryModel.findByIdAndUpdate(id, {
          $unset: { offerTime: "" ,discountPrice:"" }
      });
  
      res.redirect('/admin/offer');
  } catch (error) {
      console.log('Error ending category offer:', error.message);
  }
  

}




// const loadsales = async(req,res)=>{
//     try{
//       let product=await  ProductModel.find({list:true})
//         const perPage=8;
//             const page = parseInt(req.query.page) || 1;
//             const totalproducts= await ProductModel.countDocuments({});
//             const totalPage=Math.ceil(totalproducts / perPage);
//     const order=await orderModel.find({status: "Delivered"}).populate('user').skip(perPage * (page-1)).limit(perPage).sort({_id:-1});
//     console.log(order)
//     res.render('adminsales',{order:order.reverse()});
//     }
//     catch(err){
//         console.log('sales details',err.message);
//     }
//     }
    

    
const loadsales = async (req, res) => {
  try {
    // Fetch products with list:true (not used further in the code, consider its purpose)
    let products = await ProductModel.find({ list: true });

    const perPage = 8;
    const page = parseInt(req.query.page) || 1;

    // Get the total count of products (used for pagination)
    const totalProducts = await ProductModel.countDocuments({ list: true });
    const totalPages = Math.ceil(totalProducts / perPage);

    // Fetch orders with status "Delivered", populate 'user', and apply pagination and sorting by orderDate in descending order
    const orders = await orderModel
      .find({ status: "Delivered" })
      .populate('user')
      .skip(perPage * (page - 1))
      .limit(perPage)
      .sort({ orderDate: -1 });  // Sort by orderDate in descending order

    // Render the adminsales view with the orders
    res.render('adminsales', { order: orders, totalPages, currentPage: page });
  } catch (err) {
    console.log('sales details', err.message);
    res.status(500).send('Internal Server Error');
  }
};

    

    
    // const formatDateToDDMMYYYY = (date) => {
    //   const day = String(date.getDate()).padStart(2, '0');
    //   const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
    //   const year = date.getFullYear();
    //   return `${day}/${month}/${year}`;
    // };
    
    
    // const dateFilter = async (req, res) => {
    //   try {
    //     const date = req.query.value;
    //     const date2 = req.query.value1;
    
    //     // Parse the dates from query parameters
    //     const [year, month, day] = date.split('-').map(Number);
    //     const [year1, month1, day1] = date2.split('-').map(Number);
    
    //     // Construct Date objects
    //     const rotatedDate = new Date(year, month - 1, day); // YYYY, MM (0-based), DD
    //     const rotatedDate1 = new Date(year1, month1 - 1, day1); // YYYY, MM (0-based), DD
    
    //     // Ensure times are at the beginning and end of the day for correct range query
    //     rotatedDate.setHours(0, 0, 0, 0);
    //     rotatedDate1.setHours(23, 59, 59, 999);
    
    //     // Fetch orders within the date range
    //     const order = await orderModel.find({
    //       status: { $in: ["Delivered"] },
    //       orderDate: {
    //         $gte: rotatedDate,
    //         $lte: rotatedDate1
    //       }
    //     }).sort({ _id: -1 });
    
    //     // Format order dates for display
    //     const formattedOrders = order.map(order => ({
    //       ...order._doc, // Spread the existing fields of the order
    //       orderDate: formatDateToDDMMYYYY(new Date(order.orderDate))
    //     }));
    
    //     console.log(formattedOrders);
    
    //     // Render with formatted orders
    //     res.render("adminsales", { order: formattedOrders });
    //   } catch (error) {
    //     console.log(error.message);
    //     res.status(500).send("Internal Server Error");
    //   }
    // };
    const dateFilter = async (req, res) => {
      try {
        console.log('hi');
        const date = req.query.value;
        const date2 = req.query.value1;
    
        const [day, month, year] = date.split('-').map(Number); // Corrected to match DD-MM-YYYY format
        const [day1, month1, year1] = date2.split('-').map(Number); // Corrected to match DD-MM-YYYY format
    
        console.log([year, month, day], [year1, month1, day1]);
    
        const startDate = new Date(year, month - 1, day); // Corrected month indexing
        const endDate = new Date(year1, month1 - 1, day1); // Corrected month indexing
    
        // Ensure times are at the beginning and end of the day for correct range query
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        console.log(startDate, endDate);
    
        // Fetch orders within the date range
        const orders = await orderModel.find({
          status: { $in: ["Delivered"] },
          orderDate: {
            $gte: startDate,
            $lte: endDate
          }
        }).sort({ _id: -1 });
    
        // Format order dates for display
        const formattedOrders = orders.map(order => ({
          ...order._doc, // Spread the existing fields of the order
          orderDate: formatDateToDDMMYYYY(new Date(order.orderDate))
        }));
    
        console.log(formattedOrders);
    
        // Render with formatted orders
        res.render("adminsales", { order: formattedOrders });
      } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
      }
    };
    
    // Helper function to format date to DD-MM-YYYY
    function formatDateToDDMMYYYY(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    
    const filterData = async (req, res) => {
      try {
        const filterData = req.body;
        console.log(filterData);
    
        let date;
        const currentDate = new Date();
        let order = [];
    
        if (filterData.type === 'today') {
          date = 1;
        } else if (filterData.type === 'week') {
          date = 7;
        } else if (filterData.type === 'custom') {
          const endDate = new Date(filterData.endDate);
          const startDate = new Date(filterData.startDate);
    
          const differenceMs = endDate.getTime() - startDate.getTime();
          const differenceDays = differenceMs / (1000 * 3600 * 24);
          date = Math.round(differenceDays);
    
          console.log(date);
    
          for (let i = 0; i <= date; i++) {
            const start = new Date(startDate);
            start.setDate(start.getDate() + i);
            start.setHours(0, 0, 0, 0);
    
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
    
            const dailyOrders = await orderModel.find({
              status: "Delivered",
              orderDate: {
                $gte: start,
                $lt: end,
              },
            }).populate('user');
    
            order = [...order, ...dailyOrders];
          }
    
          return res.json({ success: true, message: 'Filter data received successfully', order });
        } else {
          date = 30;
        }
    
        for (let i = 0; i < date; i++) {
          const start = new Date(currentDate);
          start.setDate(currentDate.getDate() - i);
          start.setHours(0, 0, 0, 0);
    
          const end = new Date(currentDate);
          end.setDate(currentDate.getDate() - i);
          end.setHours(23, 59, 59, 999);
    
          const dailyOrders = await orderModel.find({
            status: "Delivered",
            orderDate: {
              $gte: start,
              $lt: end,
            },
          }).populate('user');
    
          order = [...order, ...dailyOrders];
        }
    
        res.json({ success: true, message: 'Filter data received successfully', order });
      } catch (error) {
        console.log('filter data', error.message);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
      }
    }
    



    
      const sortDate = async (req, res) => {
        try {
          const sort = req.query.value;
          let orderDateQuery = {};
          
          const currentDate = new Date();
          
          if (sort === "Day") {
            const currentDateString = currentDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
            orderDateQuery = {
              $gte: new Date(currentDateString),
              $lt: new Date(currentDateString).setDate(currentDate.getDate() + 1)
            };
          } else if (sort === "Week") {
            const firstDayOfWeek = new Date(currentDate);
            firstDayOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);
            
            orderDateQuery = {
              $gte: firstDayOfWeek,
              $lt: lastDayOfWeek
            };
          } else if (sort === "Month") {
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const firstDayOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            
            orderDateQuery = {
              $gte: firstDayOfMonth,
              $lt: firstDayOfNextMonth
            };
          } else if (sort === "Year") {
            const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
            const firstDayOfNextYear = new Date(currentDate.getFullYear() + 1, 0, 1);
            
            orderDateQuery = {
              $gte: firstDayOfYear,
              $lt: firstDayOfNextYear
            };
          }
      
          const order = await orderModel.find({
            status: { $nin: ["Ordered", "Canceled", "Shipped"] },
            orderDate: orderDateQuery
          }).sort({ _id: -1 });
      
          res.render("adminSales", { order });
        } catch (error) {
          console.error(error.message);
          res.status(500).send('Server Error');
        }
      };
      

     




        const pdf = async (req, res) => {
          try {
              let title = "";
              const currentDate = new Date();
      
              switch (req.query.type) {
                  case 'daily':
                      let dailySalesData = await salesReport(1);
                      generatePDF([dailySalesData], "Daily Sales Report", res);
                      break;
                  case 'weekly':
                      let weeklySalesData = [];
                      const weeks = getWeeksInMonth(currentDate);
                      for (const week of weeks) {
                          const data = await salesReportmw(week.start, week.end);
                          weeklySalesData.push({ ...data, period:`Week ${weeks.indexOf(week) + 1}, ${getMonthName(currentDate.getMonth())}` });
                      }
                      generatePDF(weeklySalesData, "Weekly Sales Report", res);
                      break;
                  case 'monthly':
                      let monthlySalesData = [];
                      const months = getMonthsInYear(currentDate.getMonth());;
                      for (const { month, year } of months) {
                          const monthStart = new Date(year, month, 1);
                          const monthEnd = new Date(year, month + 1, 0);
                          const data = await salesReportmw(monthStart, monthEnd);
                          monthlySalesData.push({ ...data, period: `${getMonthName(month)} ${currentDate.getFullYear()}` });
                      }
                      generatePDF(monthlySalesData, "Monthly Sales Report", res);
                      break;
                  case 'yearly':
                      let yearlySalesData = [await salesReport(365)];
                      generatePDF(yearlySalesData, "Yearly Sales Report", res);
                      break;
                  default:
                      res.status(400).send('Invalid report type specified.');
                      return;
              }
          } catch (error) {
              console.error('Error generating PDF:', error.message);
              res.status(500).send('Error generating PDF.');
          }
      };


      const getMonthsInYear = (currentMonth) => {
    let months = [];
    for (let month = 0; month <= currentMonth; month++) {
        months.push({ month, year: new Date().getFullYear() });
    }
    return months;
};




const getWeeksInMonth = (currentDate) => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const weeks = [];
  const firstDate = new Date(year, month, 1);
  const numDays = currentDate.getDate();

  let start = 1;
  let end = 7 - currentDate.getDay();

  while (start <= numDays) {
      if (end > numDays) {
          end = numDays;
      }

      weeks.push({ start: new Date(year, month, start), end: new Date(year, month, end) });

      start = end + 1;

      // Calculate new end based on the new start
      end = start + 6;

      // If end exceeds the number of days in the month, set it to the last day of the month
      if (end > numDays) {
          end = numDays;
      }
  }


  return weeks;
};



function getMonthName(month) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
  return monthNames[month];
}

      

      // const express = require('express');
      // const app = express();
      // // const PDFDocument = require('pdfkit');
      // const path = require('path');
      
      // // Your other middleware and route setups
      
      // app.get('/generate-pdf', (req, res) => {
      //   const salesData = [
      //     // Your sales data array here
      //   ];
      //   const title = "Sales Report";
      //   generatePDF(salesData, title, res);
      // });
      
    //   const generatePDF = (salesData, title, res) => {
    //     try {
    //       let doc = new PDFDocument({ margin: 30 });
    //       res.setHeader('Content-Type', 'application/pdf');
    //       res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, "_")}.pdf"`);
    //       doc.pipe(res);
      
    //       const today = new Date().toLocaleDateString('en-US', {
    //         year: 'numeric',
    //         month: 'long',
    //         day: 'numeric',
    //       });
    //       doc.fontSize(20).text(`${title} - ${today}`, { align: 'center' });
    //       doc.moveDown(2);
      
    //       // Table headers
    //       const tableHeaders = ['Index', 'Order ID', 'User Name', 'Order Date', 'Bill Total', 'Status', 'Payment Method', 'Coupon'];
    //       const columnWidths = [30, 80, 100, 100, 80, 100, 100, 100];
    //       const fontSize = 10;
    //       const rowHeight = 20;
    //       const headerBgColor = '#cccccc';
    //       const cellPadding = 5;
      
    //       // Draw table headers with background color
    //       let y = doc.y;
    //       doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('black');
    //       tableHeaders.forEach((header, index) => {
    //         doc
    //           .rect(30 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0), y, columnWidths[index], rowHeight)
    //           .fillAndStroke(headerBgColor, 'black')
    //           .fillColor('black')
    //           .text(header, 30 + columnWidths.slice(0, index).reduce((a, b) => a + b, 0) + cellPadding, y + cellPadding, {
    //             width: columnWidths[index] - cellPadding * 2,
    //             align: 'center',
    //             valign: 'center',
    //           });
    //       });
    //       doc.moveDown(rowHeight / 10);
      
    //       doc.font('Helvetica').fontSize(fontSize).fillColor('black');
      
    //       // Draw table rows
    //       salesData.forEach((data, index) => {
    //         y = doc.y;
    //         [
    //           index + 1,
    //           `#${data.oId}`,
    //           // data.user.name,
    //           new Date(data.orderDate).toLocaleDateString(),
    //           `INR ${data.billTotal}`,
    //           data.status,
    //           data.paymentMethod,
    //           data.coupon
    //         ].forEach((text, columnIndex) => {
    //           doc
    //             .rect(30 + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0), y, columnWidths[columnIndex], rowHeight)
    //             .stroke()
    //             .fillColor('black')
    //             .text(text, 30 + columnWidths.slice(0, columnIndex).reduce((a, b) => a + b, 0) + cellPadding, y + cellPadding, {
    //               width: columnWidths[columnIndex] - cellPadding * 2,
    //               align: 'center',
    //               valign: 'center',
    //             });
    //         });
    //         doc.moveDown(rowHeight / 10);
    //       });
      
    //       // Draw the bottom line of the table
    //       doc.lineWidth(0.5).moveTo(30, doc.y - 0.5).lineTo(570, doc.y - 0.5).stroke();
      
    //       doc.end();
    //     } catch (error) {
    //       console.error('Error generating PDF:', error.message);
    //       res.status(500).send('Error generating PDF.');
    //     }
    //   };
      
    //   // Start the server
    //   app.listen(3000, () => {
    //     console.log('Server is running on port 3000');
    //   });
      





























    



     const generateExcel = async (req, res, next) => {
        try {
            const salesDatas = await salesReport(365);
            
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');
    
            // Calculate overall discount price and concatenate coupon codes
            const overallDiscountPrice = salesDatas.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
            const couponcode = salesDatas.totalOrder.map(order => order.coupon);
            const couponCodesString = couponcode.join(', ');
    
            // Define columns
            worksheet.columns = [
                { header: 'Total Revenue', key: 'totalRevenue', width: 20 },
                { header: 'Total Orders', key: 'totalOrders', width: 15 },
                { header: 'Total Count In Stock', key: 'totalCountInStock', width: 20 },
                { header: 'Average Sales', key: 'averageSales', width: 15 },
                { header: 'Average Revenue', key: 'averageRevenue', width: 20 },
                { header: 'Revenue', key: 'revenue', width: 15 },
                { header: 'Applied Coupon Codes', key: 'couponCodes', width: 30 },
                { header: 'Overall Discount Price', key: 'overallDiscountPrice', width: 25 }
            ];
    
            // Add row with sales data
            worksheet.addRow({
                totalRevenue: salesDatas.totalRevenue,
                totalOrders: salesDatas.totalOrders,
                totalCountInStock: salesDatas.totalCountInStock,
                averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
                averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
                revenue: salesDatas.Revenue,
                couponCodes: couponCodesString,
                overallDiscountPrice: overallDiscountPrice
            });
    
            // Set headers and response for file download
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
    
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            console.log(error.message);
            return res.status(500).send('Error generating Excel report');
        }
    };
    
      
module.exports = {
    loadLogin,
    verifyAdmin,
    loadDashboard,
    logout,
    blockUser,
    unblockUser,
    loadCategory,
    listUser,
    loadorder,
    loadorderdetails,
    requestCancel,
    requestAccept,
     updateorder,
     offer,
   loadsales ,
    dateFilter ,
    sortDate ,
    // generatePDF,
    pdf,
    generateExcel,
    categoryoffer,
    filterData
   

    
}