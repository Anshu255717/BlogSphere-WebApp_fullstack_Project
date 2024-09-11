const mongoose = require('mongoose');
require('dotenv').config();

const url = process.env.DB_URL; 
mongoose.connect(url, {
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => {
    console.log('Database connected successfully!');
})
.catch((err) => {
    console.log('Error in connecting to the database', err);
});

module.exports = mongoose;
