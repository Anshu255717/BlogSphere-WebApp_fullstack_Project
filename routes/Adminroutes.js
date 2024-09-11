const express=require('express');
const multer = require('multer');
const bodyparser=require('body-parser');
const admincontrollers=require('../controllers/Admincontrollers');
const loginauth=require('../middlewares/islogin');
const router=express.Router();
router.use(bodyparser.json());
router.use(bodyparser.urlencoded({extended:true}));
const isadminsignedup=require('../middlewares/issignedup');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Public/Postimages'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now()+file.originalname);
    }
});

const upload = multer({ storage: storage });

const profilepic=multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Public/Profilepics'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now()+file.originalname);
    }
});

const profileupload = multer({ storage: profilepic });
router.get('/signup',(req,res,next)=>{
    if(req.cookies.token)
    res.redirect('/admin/dashboard');
    else
    next();
},admincontrollers.adminsignup);
router.post('/signup',profileupload.single("profilePic"),admincontrollers.signupproceed);
router.get('/login',loginauth.islogout,admincontrollers.showlogin);
router.get('/verify-otp',isadminsignedup, admincontrollers.showOtpPage);
router.post('/verify-otp', admincontrollers.verifyOTP);
router.post('/resend-otp', admincontrollers.resendOtp);
router.post('/login',admincontrollers.verifylogin);
router.get('/logout',loginauth.islogin,admincontrollers.logout);
router.get('/dashboard',loginauth.islogin,admincontrollers.showdashboard);
router.get('/create-post',loginauth.islogin,admincontrollers.showPostdashboard);
router.post('/create-post',loginauth.islogin,upload.single("postimage"),admincontrollers.addPost);
router.get('/forgot-password',loginauth.islogout,admincontrollers.showforgotPage);
router.post('/forgot-password',admincontrollers.Sendresetemail);
router.get('/reset-password',loginauth.islogout,admincontrollers.resetpassword);
router.post('/reset-password',admincontrollers.reset);
router.get('/successfully-resetted',admincontrollers.successfulreset);
router.get('/superadmin', admincontrollers.showSuperAdminPage);
router.delete('/delete-admin/:id',admincontrollers.deleteAdmin);
router.delete('/delete-post/:id', admincontrollers.deletePost);
module.exports=router;