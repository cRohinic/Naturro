const WalletModel = require('../models/walletModel');
const orderModel = require('../models/orderModel');
const User = require('../models/userModel');
const addtoWallet = async (req, res) => {
    
    try {
        const { orderId, userId } = req.body;
      

        const order = await orderModel.findById(orderId);
       
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let wallet = await WalletModel.findOne({ user: userId });
        if (!wallet) {
          
            wallet = new WalletModel({
                user: userId,
                balance: 0, 
                transactions: [] 
            });
        }

        wallet.balance += order.billTotal;
        wallet.transactions.push({
            amount: order.billTotal,
            type: 'credit',
            reason: 'Refund for order ' + orderId
        });

        await wallet.save();

        return res.json({ success: true, message: 'Amount refunded successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};



// const loadWallet = async (req, res) => {
//     try {
//       const wallet = await walletModel.findOne({ user: req.session.user });
  
//       if (!wallet) {
//         return res.status(404).render('wallet', { wallet: null, message: 'Wallet not found' });
//       }
  
//       res.render('wallet', { wallet });
//     } catch (error) {
//       console.log('loadWallet Error:', error.message);
//       res.status(500).render('error', { message: 'Internal Server Error' });
//     }
//   };
  
module.exports={
addtoWallet

}