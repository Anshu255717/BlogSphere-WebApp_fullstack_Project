const jwt = require('jsonwebtoken');
const adminmodel = require('../models/Adminmodel');
module.exports=async (req, res, next) => {
    try {
        const adminToken = req.cookies.token;
        const userToken = req.cookies.usertoken;
        if (adminToken) {
            jwt.verify(adminToken, 'shshsh', async (err, decoded) => {
                if (err)
                {
                    return res.status(401).send('Unauthorized');
                }
                const admin = await adminmodel.findById(decoded.id);
                if (!admin)
                {
                    return res.status(401).send('Unauthorized');
                }
                req.user =
                {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email
                };
                next();
            });
        } 
        else if (userToken)
             {
                jwt.verify(userToken, 'shshsh', (err, decoded) => {
                    if (err)
                    {
                        return res.status(401).send('Unauthorized');
                    }
                    req.user = decoded;
                    next();
                });
            } 
            else 
            {
                res.render("userlogin", { postid: req.params.id , error: null});
            }
        }
        catch (error) {
        console.error('Authentication error:', error);
        res.status(500).send('Internal Server Error');
    }
}