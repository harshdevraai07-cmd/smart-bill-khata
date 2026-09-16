const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler', required: true },
  paymentDate: { type: Date, default: Date.now },
  amountPaid: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer'], default: 'Cash' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);