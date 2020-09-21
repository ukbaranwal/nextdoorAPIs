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

const fileStorageBanners = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('images', 'banners'));
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

const bannerUpload = multer({ storage: fileStorageBanners, fileFilter: fileFilter });

router.put('/firebaseTokenUnregistered', vendorController.putFirebaseTokenUnregistered);

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

router.delete('/vendor', vendorController.deleteVendor);

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

router.put('/forgotPassword',
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

router.get('/products', isAuth, isAllowed, vendorController.getProducts);

router.get('/couponProducts', isAuth, isAllowed, vendorController.getCouponProducts);

router.get('/productTemplates', isAuth, isAllowed, vendorController.getProductTemplates);

router.put('/product', isAuth, isAllowed, productUpload.array('images', 4), vendorController.putProduct);

router.patch('/product', isAuth, isAllowed, vendorController.patchProduct);

router.delete('/product', isAuth, isAllowed, vendorController.deleteProduct);

router.patch('/productInStock', isAuth, isAllowed, vendorController.patchProductInStock);

router.put('/productImage', isAuth, isAllowed, productUpload.single('image'), vendorController.addProductImage);

router.delete('/productImage', isAuth, isAllowed, vendorController.deleteProductImage);

router.put('/productColor', [body('hex_color').isHexColor()], isAuth, isAllowed, vendorController.putProductColor);

router.patch('/productColor', [body('hex_color').isHexColor()], isAuth, isAllowed, vendorController.patchProductColor);

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

router.patch('/orderConfirm', isAuth, vendorController.orderConfirmed);

router.patch('/orderCancel', isAuth, vendorController.orderCancel);

router.get('/productCategory', vendorController.getProductCategories);

router.get('/dashboard', isAuth, isAllowed, vendorController.getDashboard);

router.get('/dashboardRevenue', isAuth, isAllowed, vendorController.getOrderRevenueDashboard);

router.get('/order', isAuth, isAllowed, vendorController.getOrder);

router.get('/orders', isAuth, isAllowed, vendorController.getOrders);

router.get('/reviews', isAuth, isAllowed, vendorController.getReviews);

router.post('/complaint', isAuth, isAllowed, vendorController.postComplaint);

router.put('/banner', isAuth, isAllowed, bannerUpload.single('image'), vendorController.putBanner);

router.delete('/banner', isAuth, isAllowed, vendorController.deleteBanner);

router.put('/notification', isAuth, isAllowed, vendorController.putNotification);

router.get('/notification', isAuth, isAllowed, vendorController.getNotification);

router.delete('/notification', isAuth, isAllowed, vendorController.deleteNotifications);

router.get('/helpTabs', vendorController.getHelpTabs);

router.get('/helpContent', vendorController.getHelpContent);

router.put('/coupon', isAuth, isAllowed, vendorController.putCoupon);

router.patch('/coupon', isAuth, isAllowed, vendorController.patchCoupon);

router.delete('/coupon', isAuth, isAllowed, vendorController.deleteCoupon);

router.get('/coupon', isAuth, isAllowed, vendorController.getCoupons);

router.patch('/couponStatus', isAuth, isAllowed, vendorController.patchCouponIsLive);

router.get('/colorVariants', vendorController.getColorVariants);

router.get('/sizeVariants', vendorController.getSizeVariants);

module.exports = router;
