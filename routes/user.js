var express = require('express');
var router = express.Router();
const userController = require('../controllers/user');
const { body } = require('express-validator');
//is Auth is to check if vendor is Authorised to access
const isAuth = require('../middlewares/is-auth');

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
  userController.postSignup);

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
  userController.postSignin);

router.post('/forgotPassword',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  userController.postForgotPassword);

router.patch('/forgotPassword',
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
  userController.putForgotPassword);

router.patch('/changePassword', body('new_password')
  .trim()
  .isLength(min = 8)
  .withMessage('New Password should be atleast 8 characters long'), isAuth, userController.putChangePassword);

router.patch('/dashboard', 
[
  body('name')
    .trim()
    .isLength(min = 3),
  body('city')
    .trim()
    .isLength(min = 3),
  body('phone')
    .trim()
    .isLength(length = 10)
    .withMessage('Phone number should be 10 characters long')
], 
isAuth, userController.patchUpdateDashboard);

router.patch('/location', isAuth, userController.patchUpdateLocation);

router.patch('/cart', 
[
  body('product_id')
    .isNumeric(),
  body('quantity')
    .isNumeric(),
], 
isAuth, userController.patchCart);

router.put('/address',
[
  body('name')
    .trim()
    .isLength(min = 3),
  body('address')
    .trim()
    .isLength(min = 3),
  body('city')
    .trim()
    .isLength(min = 3),
  body('postcode')
    .trim()
    .isNumeric()
    .isLength(length = 6)
    .withMessage('Postcode should be 6 characters long'),
  body('phone')
    .trim()
    .isNumeric()
    .isLength(length = 10)
    .withMessage('Phone number should be 10 characters long')
],
isAuth, userController.putAddress);

router.patch('/address',
[
  body('name')
    .trim()
    .isLength(min = 3),
  body('address')
    .trim()
    .isLength(min = 3),
  body('city')
    .trim()
    .isLength(min = 3),
  body('postcode')
    .trim()
    .isNumeric()
    .isLength(length = 6)
    .withMessage('Postcode should be 6 characters long'),
  body('phone')
    .trim()
    .isNumeric()
    .isLength(length = 10)
    .withMessage('Phone number should be 10 characters long')
], 
isAuth, userController.patchAddress);

// router.put('/order', isAuth, userController.putOrder);

module.exports = router;
