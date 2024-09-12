require('dotenv').config(); 
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const adminroutes = require('./routes/Adminroutes');
const blogroutes = require('./routes/Blogroutes');
const captchaRoutes = require('./routes/captchaRoutes');
const adminmodel = require('./models/Adminmodel');
const paymentcontroller = require('./controllers/Paymentcontrollers');
const isadminsignedup = require('./middlewares/issignedup');
const { Server } = require('socket.io');
const app = express();
const http = require('http').createServer(app);
const io = new Server(http, {});
const session = require('express-session');

const socketLogic = require('./socket');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'Public')));

app.get('/', (req, res) => res.render('index'));
app.get('/about', (req, res) => res.render('about'));
app.get('/contact', (req, res) => res.render('contact'));
app.get('/cancel', isadminsignedup, (req, res) => res.render('cancel'));
app.get('/payment', isadminsignedup, (req, res) => res.render('payment'));
app.get('/testimonals', (req, res) => res.render('testimonals'));
app.get('/features', (req, res) => res.render('features'));
app.get('/templates', (req, res) => res.render('templates'));

app.use('/admin', adminroutes);
app.use('/blogs', blogroutes);
app.use('/captcha', captchaRoutes);
app.post("/create-checkout-session", paymentcontroller.checkout);
app.get('/payment-success', paymentcontroller.paymentsucceed);

socketLogic(io);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}\n`);
});
