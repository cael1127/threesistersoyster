const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  variety: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 0
  },
  size: {
    type: String,
    required: true
  },
  age: String,
  health: {
    type: String,
    enum: ['excellent', 'good', 'fair'],
    default: 'good'
  },
  location: String,
  harvestReady: {
    type: Boolean,
    default: false
  },
  pricePerDozen: {
    type: Number,
    min: 0
  },
  type: {
    type: String,
    enum: ['nursery', 'farm'],
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema); 