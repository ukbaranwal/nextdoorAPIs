var express = require('express');
var router = express.Router();
const adminController = require('../controllers/admin');
const { body } = require('express-validator');
const isRoot = require('../middlewares/is-root');
const multer = require('multer');
const path = require('path');

const fileStorageVendorType = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('images', 'vendor_type'));
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

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

const fileStorageProductCategory = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('images', 'product_category'));
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const uploadVendorType = multer({ storage: fileStorageVendorType, fileFilter: fileFilter });
const uploadProductCategory = multer({ storage: fileStorageProductCategory, fileFilter: fileFilter })

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
            .matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)
            .withMessage('Password should be combination of one uppercase , one lower case, one special char, one digit and min 8 , max 20 char long'),
    ],
    adminController.postSignup);

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
    adminController.postSignin);

router.put('/vendorType', isRoot, uploadVendorType.single('image'), adminController.putVendorType);

router.patch('/vendorType', isRoot, uploadVendorType.single('image'), adminController.patchVendorType);

router.delete('/vendorType', isRoot, adminController.deleteVendorType);

router.put('/productCategory', isRoot, uploadProductCategory.single('image'), adminController.putProductCategory);

router.patch('/productCategory', isRoot, uploadProductCategory.single('image'), adminController.patchProductCategory);

router.delete('/productCategory', isRoot, adminController.deleteProductCategory);

module.exports = router;