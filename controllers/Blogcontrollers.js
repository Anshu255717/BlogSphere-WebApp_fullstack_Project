require('dotenv').config();
const Postmodel=require('../models/Postmodel');
const adminmodel=require('../models/AdminModel');
const commentmodel=require('../models/Commentsmodel');
const replymodel=require('../models/Replymodel');
const responsemodel=require('../models/Responsemodel');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { htmlToText } = require('html-to-text');
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
  });
class Blogcontrollers
{
    static async Blogloads(req,res)
    {
        try
        {
            const allposts=await Postmodel.find({user_id:req.user.id});
            const admin=await adminmodel.findOne({_id:req.user.id});
            allposts.forEach(post => 
            {
                post.adminName = admin.name;
            });
            res.render('post',{posts:allposts,admin:admin});
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async Blogpost(req,res)
    {
        try
        {
            const likes = await responsemodel.countDocuments({ postId: req.params.id, type: 1 });
            const dislikes = await responsemodel.countDocuments({ postId: req.params.id, type: 0 });
            const post = await Postmodel.findById(req.params.id);
            if (!post)
            {
                return res.status(404).send('Post not found');
            }
            const admin = await adminmodel.findById(post.user_id);
            if (!admin)
            {
                return res.status(404).send('Admin not found');
            }
            post.adminName = admin.name;
            post.postid=req.params.id;
            const comments=await commentmodel.find({postId:req.params.id}).exec();
            if(comments.length>0)
            {
                for (let i = 0; i < comments.length; i++) {
                    let replies = await replymodel.find({ commentId: comments[i]._id }).exec();
                    comments[i].replies = replies.reverse(); 
                }
            }
            else{
                post.allcomments=[];
            }
            post.allcomments = comments; 
            post.username = req.user.name;
            post.adminemail=admin.email;
            res.render('Singlepost',{post:post,likes:likes,dislikes:dislikes});
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async allBlogs(req, res) {
        try {
            const allposts = await Postmodel.find({});
            const AdminNames = await Promise.all(
                allposts.map(async (post) => {
                    const admin = await adminmodel.findById(post.user_id);
                    if (admin) {
                        post.adminName = admin.name;
                    } else {
                        post.adminName = 'Unknown'; 
                    }
                    return post;
                })
            );
            res.render('allposts', { posts:AdminNames });
        } catch (err)
         {
            console.log(err);
            res.status(500).send('Internal Server Error');
        }
    }
    
    static async ShowBlog(req, res) {
        try {
            const likes = await responsemodel.countDocuments({ postId: req.params.id, type: 1 });
            const dislikes = await responsemodel.countDocuments({ postId: req.params.id, type: 0 });
            const post = await Postmodel.findById({ _id: req.params.id });
            if (!post)
            {
                return res.status(404).send('Post not found');
            }
    
            const admin = await adminmodel.findById(post.user_id);
            if (!admin) {
                return res.status(404).send('Admin not found');
            }
            post.adminName = admin.name;
            post.postid = req.params.id;
    
            const comments = await commentmodel.find({ postId: req.params.id }).exec();

            for (let i = 0; i < comments.length; i++) {
                let replies = await replymodel.find({ commentId: comments[i]._id }).exec();
                comments[i].replies = replies.reverse();
            }
            post.allcomments = comments; 
            post.username = req.user.name;
            post.useremail = req.user.email;
    
            res.render('singleposts', { post: post,likes:likes,dislikes:dislikes});
        } catch (err)
         {
            console.error(err);
            res.status(500).send('Internal server error');
        }
    }
          
    static async addcomments(req,res)
    {
        try
        {
           const {name,email,comment,postid}=req.body;
           const Comment= new commentmodel({
            postId:postid,
            username:name,
            email:email,
            content:comment
             })
             const commentadded=await Comment.save();
             if(commentadded)
             {
                res.json({
                    success: true,
                    _id:commentadded._id,
                    email:req.user.email,
                    createdAt:commentadded.createdAt,
                    postid:commentadded.postId
                });
             }
        }
        catch(err)
        {
            console.log(err);
            res.status(500).json({ success: false, message: 'Error adding comment' });
        }
    }


    static async deletecomment(req,res)
    {
        try 
        {
            const commentId = req.params.commentId;
            const deleted = await commentmodel.deleteOne({_id:commentId});
            const replydeleted=await replymodel.deleteMany({commentId:commentId});
    
            if (!deleted&&!replydeleted) {
                return res.status(404).json({ success: false, message: 'Comment not found' });
            }
            res.json({
                success: true,
                commentid:commentId
            });
        } 
        catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error deleting comment' });
        } 
    }
    static async Deleteblog(req, res) {
        try {
            const response=await responsemodel.deleteMany({postId:req.params.id});
            const deleted = await Postmodel.deleteOne({ _id: req.params.id });
            if (deleted &&response)
              {
                const commentsDeleted = await commentmodel.deleteMany({ postId: req.params.id });
                if (commentsDeleted)
                {
                    res.status(200).json({ success: true, message: "Post deleted successfully", postId: req.params.id });
                }
            }
        } catch (err)
        {
            console.log(err);
            res.status(400).send({ success: false, msg: err.message });
        }
    }    
    static async Editblog(req,res)
    {
        try
        {
          const postdata=await Postmodel.findById(req.params.id);
           res.render('admin/edit',{data:postdata});

        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async Editsave(req,res)
    {
        try
        {
           const {title,content}=req.body;
           const issaved=await Postmodel.updateOne({_id:req.params.id},{$set:{title:title,content:content}});
           if(issaved)
           {
              res.redirect(`/blogs/${req.params.id}`);
           }
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static async addreply(req,res)
    {
        try{
            const {email,commentId,postId,reply}=req.body;
            const replydata=new replymodel({
                commentId:commentId,
                postId:postId,
                email:email,
                content:reply
            })
            const issaved=await replydata.save();
            if(issaved)
            {
                res.json({
                    success: true,
                    reply:issaved,
                });
            }
            else
            {
                res.status(500).json({ success: false, message: 'Error in adding reply' });
            }
        }
        catch(err)
        {
            console.log(err);
        }
    }
    static  generateOTP() {
        
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    static async userlogin(req, res) {
        try {
            const { name, email, postid, captcha } = req.body;
    
            if (!email) {
                return res.status(400).send("Email is required");
            }
    
            if (captcha !== req.session.captcha) {
                return res.render('userlogin',
                { 
                    error: "Invalid CAPTCHA. Please try again.", 
                    postid: postid 
                });
            }
            const otp = Blogcontrollers.generateOTP();
            req.session.otp = otp;
            req.session.email = email;
            req.session.name=name;
    
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}.`
            };
    
            await transporter.sendMail(mailOptions);
            res.render('userotpverify', { postid: postid });
    
        } catch (err) 
        {
            console.log(err);
            res.status(500).send("Internal server error");
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { otp, postid } = req.body;
            const { name, email } = req.session; 
            if (otp !== req.session.otp) {
                const otp = Blogcontrollers.generateOTP();
                req.session.otp = otp;

                const mailOptions = {
                    from:process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your OTP Code',
                    text: `Your OTP code is ${otp}.`
                };
                await transporter.sendMail(mailOptions);
                return res.render('userotpverify',
               { 
                    error: "Invalid OTP. Please try again.", 
                    postid: postid 
                });
            }
    
            const token = jwt.sign({ name, email },process.env.JWT_SECRET);
            res.cookie('usertoken', token, { httpOnly: true ,maxAge: 7 * 24 * 60 * 60 * 1000})
            res.redirect(`/blogs/all/posts/${postid}`);
        } catch (err) {
            console.log(err);
            res.status(500).send("Internal server error");
        }
    }

    static async resendOtp(req, res) {
        try {
            const { email } = req.session;
            if (!email) {
                return res.status(400).json({ success: false, message: 'No email found in session' });
            }

            const otp = Blogcontrollers.generateOTP();
            req.session.otp = otp;

            const mailOptions = {
                from:process.env.EMAIL_USER,
                to: email,
                subject: 'Your OTP Code',
                text: `Your OTP code is ${otp}.`
            };

            await transporter.sendMail(mailOptions);
            res.json({ success: true });
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, message: 'Failed to resend OTP' });
        }
    }

    static async exportPostAsPDF(req, res) {
        try {
            const post = await Postmodel.findById(req.params.id);
            if (!post) {
                return res.status(404).send('Post not found');
            }
    
            const doc = new PDFDocument();
            const filename = `${post.title}.pdf`;
    
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/pdf');
    
            doc.pipe(res);
    
            doc.fontSize(18).text(post.title, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`By: ${req.user.name}`, { align: 'center' });
            doc.moveDown();
    
            const textContent = htmlToText(post.content, {
                wordwrap: 130,
            });
    
            doc.fontSize(12).text(textContent, { align: 'left' });
    
            doc.end();
        } catch (err) {
            console.log(err);
            res.status(500).send('Error exporting post');
        }
    }
    // Controller to handle contact form submission
static async contactmail(req, res) {
    const { name, email, message } = req.body;
    try {
        const result = await Blogcontrollers.sendContactEmail(name, email, message);
        if (result.success) {
            res.render('contacts', { name: name, successMessage: 'Thank you for contacting us! We will get back to you soon.', errorMessage: null });
        } else {
            res.render('contacts', { name: name, successMessage: null, errorMessage: 'Failed to send your message. Please try again later.' });
        }
    } catch (error) {
        console.error('Failed to process contact email:', error);
        res.render('contacts', { name: name, successMessage: null, errorMessage: 'An unexpected error occurred. Please try again later.' });
    }
}
static async sendContactEmail(name, senderEmail, message) {
  const mailOptions = {
      from: senderEmail,
      to:process.env.EMAIL_USER,
      subject: `New Contact Us Message from ${name}`,
      text: `You have received a new message from ${name} (${senderEmail}):\n\n${message}`,
      replyTo: senderEmail,
  };
  try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return { success: true, info: info.response };
  } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
  }
}


static async contactmail(req, res) {
  const { name, email, message } = req.body;
  try {
      const result = await Blogcontrollers.sendContactEmail(name, email, message);
      if (result.success) {
          res.render('contacts', { name: name, successMessage: 'Thank you for contacting us! We will get back to you soon.', errorMessage: null });
      } else {
          res.render('contacts', { name: name, successMessage: null, errorMessage: 'Failed to send your message. Please try again later.' });
      }
  } catch (error) {
      console.error('Failed to process contact email:', error);
      res.render('contacts', { name: name, successMessage: null, errorMessage: 'An unexpected error occurred. Please try again later.' });
  }
}
}
module.exports=Blogcontrollers;