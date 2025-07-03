const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['oyster', 'merch'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  inventory: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema); 