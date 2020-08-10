var express = require('express');
var router = express.Router();
const adminController = require('../controllers/admin');
//body is to validate inputs
const { body } = require('express-validator');
//isRoot is middleware to check if admin has root access
const isRoot = require('../middlewares/is-root');
//multer is to manage files
const multer = require('multer');
const path = require('path');

//File Path for Vendor Type
const fileStorageVendorType = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('images', 'vendor_type'));
    },
    //File name for images stored
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

//images filter
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

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join('images','vendors'));
    },
    filename: (req, file, cb) => {
      cb(null, new Date().toISOString() + '-' + file.originalname);
    }
  });

//file storage for product category
const fileStorageProductCategory = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('images', 'product_category'));
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

//file storage for product templates
const fileStorageProductTemplate = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join('images', 'product_templates'));
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const upload = multer({ storage: fileStorage, fileFilter: fileFilter });
const uploadVendorType = multer({ storage: fileStorageVendorType, fileFilter: fileFilter });
const uploadProductCategory = multer({ storage: fileStorageProductCategory, fileFilter: fileFilter });
const uploadProductTemplate = multer({storage: fileStorageProductTemplate, fileFilter: fileFilter});

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

router.put('/productTemplate', isRoot, uploadProductTemplate.array('images', 4), adminController.putProductTemplate);

router.patch('/productTemplate', isRoot, adminController.patchProductTemplate);

router.put('/productTemplateImage', isRoot, uploadProductTemplate.single('image'), adminController.putProductTemplateImage);

router.delete('/productTemplateImage', isRoot, adminController.deleteProductTemplateImage);

router.patch('/dashboard', isRoot, adminController.patchUpdateDashboard);

router.patch('/dashboardLogo', isRoot, upload.single('image'), adminController.patchUpdateDashboardLogo);

router.delete('/dashboardLogo', isRoot, adminController.deleteDashboardLogo);

module.exports = router;