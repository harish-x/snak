const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
    },
    confirmPassword: {
        required: true,
        type:String
  },
  createdTime:{
    type:Date,
    default:Date.now()
  }
});

module.exports = mongoose.model('User',userSchema)