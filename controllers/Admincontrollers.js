require('dotenv').config();
const mongoose = require('mongoose');
const adminmodel=require('../models/AdminModel');
const Postmodel=require('../models/Postmodel');
const commentmodel=require('../models/Commentsmodel');
const responsemodel=require('../models/Responsemodel');
const replymodel=require('../models/Replymodel');
const bcrypt=require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer=require('nodemailer');
const randomstring=require('randomstring');
const fs = require('fs');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
class Admincontrollers
{
    static async adminsignup(req,res)
    {
        try
        {
            res.render('signup');
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async signupproceed(req, res) {
        try {
            const filename = req.file.filename;
            let { adminName, email, password } = req.body;
            password = await bcrypt.hash(password, 10);

            req.session.tempAdmin = {
                name: adminName,
                email: email,
                password: password,
                profile: `/Profilepics/${filename}`
            };

            Admincontrollers.sendotp(req, res, email);
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }

    static async sendotp(req, res, email) {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const otp = Math.floor(100000 + Math.random() * 900000);

        const otpToken = jwt.sign({ email: email, otp: otp }, 'shshsh', { expiresIn: '15m' });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verification OTP',
            text: `Your OTP for Registration is ${otp}. This OTP will expire in 15 minutes. Use this token for verification.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error in sending email:', error);
                if (!res.headersSent) {
                    res.status(500).send('Error in sending OTP');
                }
            } else {
                console.log('OTP Email sent:', info.response);
            }
        });
        //sms 
        client.messages.create({
            body: `Your OTP for registration is ${otp}. It will expire in 15 minutes.`,
            from: twilioPhoneNumber,
            to: '+917988338301'
        })
        .then(message => console.log('OTP SMS sent:', message.sid))
        .catch(error => {
            console.log('Error in sending SMS:', error);
            if (!res.headersSent) {
                res.status(500).send('Error in sending OTP');
            }
        });

        req.session.otp = otp;
        if (!res.headersSent) {
            res.redirect(`/admin/verify-otp?token=${otpToken}`);
        }
    }

    static async showOtpPage(req, res) {
        console.log(req.session.otp);
        try {
            const { token } = req.query;
            res.render('otp', { otpToken: token,otpInvalid:null });
        } catch (err) {
            console.log('Error rendering OTP page:', err);
            res.status(500).send('Internal Server Error');
        }
    }

    static async verifyOTP(req, res) {
        const { otp, otpToken } = req.body;
        try {
            const decoded = jwt.verify(otpToken,process.env.JWT_SECRET);
            const email = decoded.email;
            const sentOtp = decoded.otp;
            if (parseInt(otp) === req.session.otp) {
                res.redirect('/payment'); 
            } else {
                res.render('otp', { otpToken: otpToken, otpInvalid: true });
            }
        } catch (err) {
            console.log('Error verifying OTP:', err);
            res.status(400).send('Invalid or expired token');
        }
    }
    
    static async resendOtp(req, res) {
        const { otpToken } = req.body;
        try {
            const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
            const email = decoded.email;
            Admincontrollers.sendotp(req, res, email);
        } catch (err) {
            console.log('Error in resending OTP:', err);
            res.status(400).send('Invalid or expired token');
        }
    }
    
    static async showlogin(req,res)
    {
        try
        {
            res.render('login',{message:null});
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async verifylogin(req, res)
     {
        const { email, password } = req.body;
        try {
            const admin = await adminmodel.findOne({ email: email });
            if (admin) {
                const issame = await bcrypt.compare(password, admin.password);
                if (issame)
                 {
                    const token = jwt.sign
                    ({
                        id: admin._id,
                        is_admin: admin.is_admin
                    }, process.env.JWT_SECRET, { expiresIn: '1h' }); 
                    res.cookie('token', token, { httpOnly: true, maxAge: 3600000 }); 
                    res.redirect('/admin/dashboard');
                } else
                 {
                    res.render('login', { message: 'Invalid credentials' });
                  }
            } else
             {
                res.render('login', { message: 'Invalid credentials' });
            }
        } catch (err)
         {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    static async showdashboard(req,res)
    {
        try
        {
            let admin=req.user;
            const admindata=await adminmodel.findById(admin.id);
            const postdata=await  Postmodel.find({user_id:admin.id});
            const comments=await commentmodel.find({email:admindata.email});
            const replies=await responsemodel.find({email:admindata.email,type:1});
            admindata.posts=postdata.length;
            admindata.comments=comments.length;
            admindata.replies=replies.length;
            res.render('admin/dashboard',{data:admindata});
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async showPostdashboard(req,res)
    {
        try
        {
            res.render('admin/postdashboard');
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async addPost(req,res)
    {
        try
        {
         const filename=req.file.filename;
          const{title,content}=req.body;
          const Post= new Postmodel({
          title:title,
          content:content,
          user_id:req.user.id,
          image:`/Postimages/${filename}`
           })
           const Postcreate=await Post.save();
           const user=await adminmodel.find({_id:req.user.id});
          res.send({success:true,msg:'Post added Successfully',_id:Postcreate._id,filename:Postcreate.image,views:Postcreate.views,date:Postcreate.createdAt,admin:user[0].name});
        }
        catch(err)
        {
            console.log(err);
            res.send({success:false,msg:err.message});
        }
    }
    static async logout(req, res)
     {
        try
        {
            res.clearCookie('token');
            res.redirect('/');
        } catch (err)
        {
            console.log(err);
        }
    }
    static async showforgotPage(req,res)
    {
        try
        {
            res.render('forget',{message:null});
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static sendEmail(email, token)
     {
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        fs.readFile('C:/Users/Dell/Desktop/Blog Project/Public/resetpassword.html','utf8', (err, htmlTemplate) => {
            if (err)
            {
                console.error('Error reading email template file:', err);
                return;
            }

            const resetLink = `http://localhost:3002/admin/reset-password?token=${token}`;
            const htmlContent = htmlTemplate.replace('{{resetLink}}', resetLink);

            const mailOptions = {
            from:process.env.EMAIL_USER,
            to: email,
            subject: 'Reset Password',
            text: `To reset your password, please follow this link: ${resetLink}`,
            html: htmlContent
            };
    
        transporter.sendMail(mailOptions, (error, info) => {
            if (error)
            {
                console.log('Error in sending email:', error);
            } else
            {
                console.log('Email sent:', info.response);
            }
        });
    });
    }    
    static async Sendresetemail(req,res)
    {
        try
        {
            const recoveryemail=req.body.email;
            const admin=await adminmodel.findOne({email:recoveryemail});
            if(admin)
            {
            const random=randomstring.generate();
            await adminmodel.updateOne({email:recoveryemail},{$set:{token:random}})
            Admincontrollers.sendEmail(recoveryemail,random);
            res.render('forget',{message:'Password reset email is sent to your entered email address'});
            }
            else
            {
                res.render('forget',{message:'Incorrect email address!'});
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async resetpassword(req, res) {
        try {
            const token = req.query.token;
            const admindata = await adminmodel.findOne({ token: token });
            if (admindata)
            {
                res.render('resetpassword', { token: token, admin_id: admindata._id });
            } else
            {
                res.status(404).send('Invalid or expired token');
            }
        } 
        catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    
    static async reset(req, res) {
        try {
            const { newPassword, admin_id } = req.body;
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const result = await adminmodel.findByIdAndUpdate(
                admin_id,
                { $set: { password: hashedPassword, token: '' } },
                { new: true }
            );
            if (result) 
            {
                res.redirect('/admin/successfully-resetted');
            } 
            else
            {
                res.status(404).send('Admin not found');
            }
        } catch (err)
         {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }

    static async successfulreset(req,res){
        try{
            res.render('successfullreset');
        }
        catch(err)
        {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    static async showSuperAdminPage(req, res) {
        try {
            const admins = await adminmodel.find();
            const posts = await Postmodel.find();

            res.render('superadmin', { admins, posts });
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    static async deleteAdmin(req, res) {
        try {
            const adminId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(adminId)) {
                return res.status(400).send('Invalid admin ID');
            }

            const admin = await adminmodel.findById(adminId);
            if (!admin) {
                return res.status(404).send('Admin not found');
            }

            await Postmodel.deleteMany({ user_id: adminId });
            await commentmodel.deleteMany({ email: admin.email });
            await replymodel.deleteMany({ email: admin.email });
            await responsemodel.deleteMany({ email: admin.email });
            await adminmodel.findByIdAndDelete(adminId);
            res.send({ success: true, message: 'Admin and related data deleted successfully' });
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }

    static async deletePost(req, res) {
        try {
            const postId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).send('Invalid post ID');
            }

            const post = await Postmodel.findById(postId);
            if (!post) {
                return res.status(404).send('Post not found');
            }
            await commentmodel.deleteMany({ postId: postId });
            await replymodel.deleteMany({ postId: postId });
            await replymodel.deleteMany({ postId: postId });
            await Postmodel.findByIdAndDelete(postId);
            res.send({ success: true, message: 'Post and related comments and replies deleted successfully' });
        } catch (err) {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    
}
module.exports=Admincontrollers;