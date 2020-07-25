var express = require('express');
var router = express.Router();
const vendorController = require('../controllers/vendor');
const { body } = require('express-validator');
const isAuth = require('../middleware/is-auth');

router.post('/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .normalizeEmail(),
    body('phone')
      .trim()
      .isLength(length = 10)
      .withMessage('Invalid Mobile Number'),
    body('name')
      .trim()
      .not()
      .isEmpty(),
    body('password')
      .trim()
      .isLength(min = 8)
      .withMessage('Password should be atleast 8 characters long')
  ],
  vendorController.postSignup);

router.post('/signin',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength(min = 8)
      .withMessage('Password should be atleast 8 characters long')
  ],
  vendorController.postSignin);

router.post('/forgotpassword',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  vendorController.postForgotPassword);

router.put('/forgotpassword',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .normalizeEmail(),
    body('password')
      .trim()
      .isLength(min = 8)
      .withMessage('Password should be atleast 8 characters long')
  ],
  vendorController.putForgotPassword);

router.put('updateDashboard', isAuth, )

module.exports = router;
