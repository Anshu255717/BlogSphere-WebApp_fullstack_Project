const mongoose = require('../dbconfig');

const responseSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  email:{
     type:String
  },
  type:{
    type:Number,
    required:true
  }

});

const Response = mongoose.model('Response', responseSchema);

module.exports = Response;
