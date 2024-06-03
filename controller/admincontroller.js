const user = require("../models/userModel");
const bcrypt = require('bcrypt');

const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel")
const productModel=require('../models/productModel');
const walletModel= require('../models/walletModel');



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

const loadorder =async(req,res)=>{
    try{
        const order = await orderModel.find({}).populate({path:'user',model:'User'});
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
        const category=await categoryModel.find({is_deleted:false});
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





const loadsales = async(req,res)=>{
    try{
    const order=await orderModel.find({status: "Delivered"}).populate('user');
    console.log(order)
    res.render('adminsales',{order});
    }
    catch(err){
        console.log('sales details',err.message);
    }
    }
    
    const formatDateToYYYYMMDD = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const year = date.getFullYear();
      return `${year}-${month}-${day}`;
    };
    
    const formatDateToDDMMYYYY = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    const dateFilter = async (req, res) => {
      try {
        const date = req.query.value;
        const date2 = req.query.value1;
    
        // Parse the dates from query parameters
        const [year, month, day] = date.split('-').map(Number);
        const [year1, month1, day1] = date2.split('-').map(Number);
    
        // Construct Date objects
        const rotatedDate = new Date(year, month - 1, day); // YYYY, MM (0-based), DD
        const rotatedDate1 = new Date(year1, month1 - 1, day1); // YYYY, MM (0-based), DD
    
        // Ensure times are at the beginning and end of the day for correct range query
        rotatedDate.setHours(0, 0, 0, 0);
        rotatedDate1.setHours(23, 59, 59, 999);
    
        // Fetch orders within the date range
        const order = await orderModel.find({
          status: { $in: ["Delivered"] },
          orderDate: {
            $gte: rotatedDate,
            $lte: rotatedDate1
          }
        }).sort({ _id: -1 });
    
        // Format order dates for display
        const formattedOrders = order.map(order => ({
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
      
      const generatePDF = (salesData, title, res) => {
          try {
              let doc = new PDFDocument();
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename="${title.toLowerCase().replace(/\s+/g, "_")}.pdf"`);
              doc.pipe(res);
      
              const today = new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
              });
              doc.fontSize(20).text(`${title} - ${today}`, { align: 'center' });
              doc.moveDown(2);
      
              for (const data of salesData) {
                  doc.moveDown(2);
                  doc.text(data.period, { align: 'left' });
      
                  const tableHeaders = ['Metric', 'Value'];
                  const columnStartPositions = [50, 300];
                  const fontSize = 12;
      
                  doc.font('Helvetica-Bold').fontSize(fontSize);
                  tableHeaders.forEach((header, index) => {
                      doc.text(header, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
                      doc.strokeColor('black').lineWidth(1);
                  });
      
                  doc.font('Helvetica').fontSize(fontSize);
                  const tableRows = [
                      ['Total Revenue', `INR ${data.totalRevenue}`],
                      ['Total Orders', data.totalOrders],
                   
                      ['Average Sales', `${data.averageSales ? data.averageSales.toFixed(2) : 'N/A'}%`],
                      ['Average Revenue', `${data.averageRevenue ? data.averageRevenue.toFixed(2) : 'N/A'}`],
                  ];
      
                  data.totalOrder.forEach(order => {
                      if (order.coupon !== 'nil') {
                          tableRows.push([`Coupon: ${order.coupon}`, `INR ${order.discountPrice}`]);
                      }
                  });
      
                  const overallDiscountPrice = data.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
                  tableRows.push(['Overall Discount Price', `INR ${overallDiscountPrice}`]);
      
                  tableRows.forEach((row, rowIndex) => {
                      row.forEach((text, index) => {
                          doc.text(text, columnStartPositions[index], doc.y, { width: 200, align: 'center' });
                      });
                      doc.moveDown(0.5);
                  });
              }
      
              doc.end();
          } catch (error) {
              console.error('Error generating PDF:', error.message);
              res.status(500).send('Error generating PDF.');
          }
      };
        

      const generateExcel = async (req, res, next) => {
        try {
          const salesDatas = await salesReport(365);
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Sales Report');
          const overallDiscountPrice=salesDatas.totalOrder.reduce((total, order) => total + order.discountPrice, 0);
          const couponcode = salesDatas.totalOrder.map(order => { return order.coupon;});
          const couponCodesString = couponcode.join(', ');
       
          worksheet.columns = [
            { header: 'Total Revenue', key: 'totalRevenue', width: 15 },
            { header: 'Total Orders', key: 'totalOrders', width: 15 },
            { header: 'Total Count In Stock', key: 'totalCountInStock', width: 15 },
            { header: 'Average Sales', key: 'averageSales', width: 15 },
            { header: 'Average Revenue', key: 'averageRevenue', width: 15 },
            { header: 'Revenue', key: 'Revenue', width: 15 },
            { header: 'Applied coupon code', key: 'couponCodesString', width: 15 },
            { header: 'overall discount price', key: 'overalldiscountprice', width: 15 }
          ];
          
        
    
    
    
          worksheet.addRow({
            totalRevenue: salesDatas.totalRevenue,
            totalOrders: salesDatas.totalOrders,
            totalCountInStock: salesDatas.totalCountInStock,
            averageSales: salesDatas.averageSales ? salesDatas.averageSales.toFixed(2) : 'N/A',
            averageRevenue: salesDatas.averageRevenue ? salesDatas.averageRevenue.toFixed(2) : 'N/A',
            Revenue: salesDatas.Revenue,
            couponCodesString:couponCodesString,
            overalldiscountprice:overallDiscountPrice
            
            
          });
          
        
    
      
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');
      
          workbook.xlsx.write(res).then(() => res.end());
        } catch (error) {
          console.log(error.message);
          return res.status(500);
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
    generatePDF,
    pdf,
    generateExcel
   

    
}