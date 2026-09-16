const Wholesaler = require('../models/Wholesaler');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

const createBill = async (req, res) => {
  const { wholesalerName, billDate, totalAmount } = req.body;
  try {
    const trimmedName = wholesalerName.trim();
    let wholesaler = await Wholesaler.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });

    if (!wholesaler) wholesaler = await Wholesaler.create({ name: trimmedName, currentBalanceDue: 0 });

    const newBill = await Bill.create({
      wholesalerId: wholesaler._id,
      billDate: billDate ? new Date(billDate) : new Date(),
      totalAmount: Number(totalAmount)
    });

    wholesaler.currentBalanceDue += Number(totalAmount);
    await wholesaler.save();

    res.status(201).json({ success: true, bill: newBill, wholesaler });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createPayment = async (req, res) => {
  const { wholesalerId, amountPaid, paymentMode } = req.body;
  try {
    const payment = await Payment.create({
      wholesalerId,
      amountPaid: Number(amountPaid),
      paymentMode: paymentMode || 'Cash'
    });

    await Wholesaler.findByIdAndUpdate(wholesalerId, {
      $inc: { currentBalanceDue: -Number(amountPaid) }
    });

    res.status(201).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getWholesalers = async (req, res) => {
  try {
    const suppliers = await Wholesaler.find().sort({ currentBalanceDue: -1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLedgerHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [wholesaler, bills, payments] = await Promise.all([
      Wholesaler.findById(id),
      Bill.find({ wholesalerId: id }).lean(),
      Payment.find({ wholesalerId: id }).lean()
    ]);

    const history = [
      ...bills.map(b => ({ ...b, type: 'BILL', date: b.billDate, amount: b.totalAmount })),
      ...payments.map(p => ({ ...p, type: 'PAYMENT', date: p.paymentDate, amount: p.amountPaid }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ wholesaler, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createBill, createPayment, getWholesalers, getLedgerHistory };