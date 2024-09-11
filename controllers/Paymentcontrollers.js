require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 
const adminmodel = require('../models/AdminModel');

class Payment {
  static async checkout(req, res) {
    try {
      console.log(req.session.tempAdmin);
      const { amount } = req.body;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: "Custom Payment",
                description: "One-time payment for services rendered",
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: "http://localhost:3002/payment-success",
        cancel_url: "http://localhost:3002/cancel",
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  }

  static async paymentsucceed(req, res) {
    try {
      const { tempAdmin } = req.session;

      if (tempAdmin) {
        const { name, password, email, profile } = tempAdmin;

        if (!name || !password || !email) {
          console.log('Missing required fields in session data');
          return res.status(400).send('Required fields missing.');
        }

        const newAdmin = new adminmodel({
          name: name,
          email: email,
          password: password,
          Profile: profile || ''
        });

        await newAdmin.save();

        req.session.destroy(err => {
          if (err) {
            console.log('Error clearing session:', err);
            res.status(500).send('Internal Server Error');
          } else {
            res.redirect('/admin/login');
          }
        });
      } else {
        res.redirect('/');
      }
    } catch (err) {
      console.log('Error processing payment success:', err);
      res.status(500).send('Internal Server Error');
    }
  }
}

module.exports = Payment;
