const Wholesaler = require('../models/Wholesaler');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const getStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [todayBills, todayPayments, totalDebtResult] = await Promise.all([
      Bill.aggregate([
        { $match: { billDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Payment.aggregate([
        { $match: { paymentDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      Wholesaler.aggregate([
        { $group: { _id: null, total: { $sum: '$currentBalanceDue' } } }
      ])
    ]);

    const recentBills = await Bill.find().populate('wholesalerId', 'name').sort({ createdAt: -1 }).limit(5);

    res.json({
      todayInward: todayBills[0]?.total || 0,
      todayPaid: todayPayments[0]?.total || 0,
      totalMarketDebt: totalDebtResult[0]?.total || 0,
      recentActivity: recentBills
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats };