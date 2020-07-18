var express = require('express');
var router = express.Router();
const Vendor = require('../models/vendor');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

router.post('/signup', function(req, res, next) {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const city = req.body.city;
  const password = req.body.password;
  Vendor.findOne({where: {email: email}}).then(vendor =>{
      if(vendor){
        return res.status(400).send({response: 'Vendor already Registered'});
      }
      return bcrypt
      .hash(password, 12)
      .then(hashedPassword => {
        return Vendor.create({name: name, email: email, phone: phone, city: city, password: hashedPassword});
      })
      .then(vendor => {
          console.log(vendor);
          res.status(200).send({response: 'Vendor Succesfully Registered'});
          return sgMail.send({
            to: email,
            from: 'ukbaranwal@gmail.com',
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
          });
      })
      .catch(err =>{
          console.log(err);
      })
  })
});
router.get('/signup', function(req, res, next) {
    // console.log(req.body);
    console.log("This Works");
    res.send("This Works");
  });

module.exports = router;
