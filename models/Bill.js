const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  wholesalerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wholesaler', required: true },
  billDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);