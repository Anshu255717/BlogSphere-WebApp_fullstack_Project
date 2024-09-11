const jwt = require('jsonwebtoken');
const admin=require('../models/AdminModel');

const islogin = (req, res, next) =>
{
    try {
        const token = req.cookies.token;
        if (!token)
        {
            return res.redirect("/admin/login");
        }
        jwt.verify(token, 'shshsh', (err, decoded) => 
        {
            if (err)
             {
                return res.redirect("/admin/login");
             }
            req.user = decoded;
            next();
        });
    }
     catch (err)
     {
      console.log(err);
      res.redirect("/admin/login");
     }
}

const islogout = (req, res, next) => {
   try {
       const token = req.cookies.token;
       if (token)
         {
           jwt.verify(token, 'shshsh', (err, decoded) =>
             {
               if (!err && decoded)
                 {
                   if (decoded.is_admin)
                    {
                       return res.redirect("/admin/dashboard");
                    }
                    else
                   {
                       return res.redirect("/");
                   }
                }
                else 
               {
                   next();
               }
           });
       }
        else 
       {
           console.log( 'no token found');
           next();
       }
   }
    catch (err)
    {
       console.log(err);
       next();
   }
};

module.exports = { islogin, islogout };
