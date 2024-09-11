const mongoose = require('../dbconfig');
const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    image: {
        type: String,
        required:true,
        default: null 
    },
    views:{
    type: Number,
      default: 0 
    },
    createdAt: {
    type: Date,
    default: Date.now
    }
});
module.exports = mongoose.model('Post', PostSchema);
