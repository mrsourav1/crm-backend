const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,

  },
  email: {
    type: String,
    required: true,
    trim: true
  },

  mobile: {
    type: Number,
    //unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
    trim: true

  },
  confirmPassword: {
    type: String,
    required: true,
    trim: true

  },
  otp: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

module.exports = mongoose.model("Admin1", adminSchema);
