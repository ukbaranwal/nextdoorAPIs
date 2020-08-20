var express = require('express');
var router = express.Router();
const vendorController = require('../controllers/vendor');
const { body } = require('express-validator');
//is Auth is to check if vendor is Authorised to access
const isAuth = require('../middlewares/is-auth');
const multer = require('multer');
const path = require('path');
const isAllowed = require('../middlewares/is-allowed');

const fileStorageProducts = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('images', 'products'));
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  }
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};


const productUpload = multer({ storage: fileStorageProducts, fileFilter: fileFilter });

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

router.delete('/vendor',vendorController.deleteVendor);

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

router.post('/forgotPassword',
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email.')
    .normalizeEmail(),
  vendorController.postForgotPassword);

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
  vendorController.putForgotPassword);

router.patch('/changePassword', body('new_password')
  .trim()
  .isLength(min = 8)
  .withMessage('New Password should be atleast 8 characters long'), isAuth, vendorController.patchChangePassword);

router.put('/firebaseToken', isAuth, vendorController.putFirebaseToken);

router.patch('/status', isAuth, vendorController.patchUpdateStatus);

router.patch('/shopTime', isAuth, vendorController.patchUpdateTime);

router.patch('/shopLocation', isAuth, vendorController.patchUpdateLocation);

router.put('/product',isAuth, isAllowed, productUpload.array('images', 4), vendorController.putProduct);

router.put('/productThroughTemplate', isAuth, isAllowed, vendorController.putProductThroughTemplate);

router.patch('/product', isAuth, isAllowed, vendorController.patchProduct);

router.delete('/product', isAuth, isAllowed, vendorController.deleteProduct);

router.patch('/productInStock', isAuth, isAllowed, vendorController.patchProductInStock);

router.put('/productImage', isAuth, isAllowed, productUpload.single('image'), vendorController.addProductImage);

router.delete('/productImage', isAuth, isAllowed, vendorController.deleteProductImage);

router.put('/productColor',[body('hex_color').isHexColor()], isAuth, isAllowed, vendorController.putProductColor);

router.patch('/productColor',[body('hex_color').isHexColor()], isAuth, isAllowed, vendorController.patchProductColor);

router.put('/productColorVariant', isAuth, isAllowed, productUpload.array('images', 4), vendorController.putProductColorVariant);

router.patch('/productColorVariant', isAuth, isAllowed, vendorController.patchProductColorVariant);

router.delete('/productColorVariant', isAuth, isAllowed, vendorController.deleteProductColorVariant);

router.patch('/primaryProductColorVariant', isAuth, isAllowed, vendorController.patchPrimaryProductColorVariant);

router.put('/relatedProducts', isAuth, isAllowed, vendorController.putRelatedProducts);

router.put('/productSizeVariant', isAuth, isAllowed, vendorController.putProductSizeVariant);

router.patch('/productSizeVariant', isAuth, isAllowed, vendorController.patchProductSizeVariant);

router.delete('/productSizeVariant', isAuth, isAllowed, vendorController.deleteProductSizeVariant);

router.patch('/productSizeVariantInStock', isAuth, isAllowed, vendorController.patchProductSizeVariantInStock);

router.patch('/orderPacked', isAuth, vendorController.orderPacked);

router.get('/productCategory', isAuth,vendorController.getProductCategories );

module.exports = router;
