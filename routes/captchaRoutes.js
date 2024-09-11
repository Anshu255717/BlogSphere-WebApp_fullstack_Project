const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');

router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({ size: 5 });
    req.session.captcha = captcha.text;
    res.type('svg');
    res.send(captcha.data); 
});

module.exports = router;
