const mongoose = require('mongoose');

const wholesalerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  phoneNumber: { type: String, default: '' },
  currentBalanceDue: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Wholesaler', wholesalerSchema);