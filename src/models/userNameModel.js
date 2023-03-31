const mongoose = require("mongoose");

const EmployeeIdSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true
    },
  }, { versionKey: false }
);

module.exports = mongoose.model("userName", EmployeeIdSchema);
