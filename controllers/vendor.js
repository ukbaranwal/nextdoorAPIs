const Vendor = require('../models/vendor');
const sendEmail = require('../util/send-mail').sendEmail;
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fileHelper = require('../util/delete-file');
const Product = require('../models/product');
const ProductTemplate = require('../models/product_template');
const Order = require('../models/order');
const Sequelize = require('sequelize');
const AWS = require('aws-sdk');
const ProductCategory = require('../models/product_category');
const FirebaseToken = require('../models/firebase_token');
const Notification = require('../models/notification');
const fs = require('fs');
const Coupon = require('../models/coupon');

exports.putFirebaseTokenUnregistered = (req, res, next) => {
    const token = req.body.token;
    const device_id = req.body.device_id;
    if (!token) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    FirebaseToken.create({device_id:device_id, firebase_token: token})
    .then(firebaseToken=>{
        res.status(200).json({ message: 'Succesfully Updated' });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};
exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const city = req.body.city;
    const password = req.body.password;
    const device_id = req.body.device_id;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!email) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!phone) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!city) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!password) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Vendor.findOne({ where: { email: email } }).then(vendor => {
        if (vendor) {
            return res.status(200).json({ message: 'Vendor already Registered' });
        }
        return bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                return Vendor.create({ name: name, email: email, phone: phone, city: city, password: hashedPassword, device_id: device_id });
            })
            .then(vendor => {
                sendEmail(email, 'Welcome to NextDoor', '<h1>We, at Next Door welcome you to our family.</h1>');
                return res.status(201).json({ message: 'Successfully signed up, please login for proceed' });
            })

    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.deleteVendor = (req, res, next) => {
    const id = req.body.id;
    if (!id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    Vendor.findByPk(id)
        .then(vendor => {
            if (!vendor) {
                const error = new Error('A vendor with this email could not be found.');
                error.statusCode = 204;
                throw error;
            }
            return vendor.destroy();
        })
        .then(result => {
            res.status(200).json({ message: 'succesfully deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

}

exports.postSignin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!password) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let loadedVendor;
    Vendor.findOne({ where: { email: email } }).then(vendor => {
        if (!vendor) {
            const error = new Error('A vendor with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        loadedVendor = vendor;
        return bcrypt.compare(password, vendor.password)
            .then(isEqual => {
                if (!isEqual) {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    throw error;
                }
                const token = jwt.sign(
                    {
                        email: loadedVendor.email,
                        id: loadedVendor.id.toString()
                    },
                    'somesupersecretsecret',
                );
                loadedVendor.password = null;
                res.status(202).json({ message: 'You have successfully signed in', data: { token: 'Bearer ' + token, vendor: loadedVendor } });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.postForgotPassword = (req, res, next) => {
    const email = req.body.email;
    if (!email) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let resetPin;
    Vendor.findOne({ where: { email: email } }).then(vendor => {
        if (!vendor) {
            const error = new Error('A vendor with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        resetPin = Math.floor(Math.random() * 10000);
        sendEmail(vendor.email, 'Request to Reset Password', '<h1>Enter this four digit pin ' + resetPin + ' to reset your password</h1>');
        vendor.reset_password_token = resetPin;
        vendor.reset_password_time = Date.now() + 3600000;
        return vendor.save()

    })
        .then(vendor => {
            res.status(200).json({ message: 'Mail sent at ' + vendor.email });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putForgotPassword = (req, res, next) => {
    const resetPin = req.body.pin;
    const email = req.body.email;
    const password = req.body.password;
    if (!email) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!password) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!resetPin) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    Vendor.findOne({ where: { email: email } }).then(vendor => {
        if (!vendor) {
            const error = new Error('A vendor with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        if (!vendor.reset_password_token) {
            const error = new Error('Please request a new pin to change your password');
            error.statusCode = 406;
            throw error;
        }
        if (vendor.reset_password_token.toString() !== resetPin.toString()) {
            const error = new Error('Enter Correct Pin to reset your password');
            error.statusCode = 406;
            throw error;
        }
        if (vendor.reset_password_time < Date.now()) {
            const error = new Error('This pin has expired, please request for new one');
            error.statusCode = 406;
            throw error;
        }
        bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                vendor.password = hashedPassword;
                vendor.reset_password_token = null;
                vendor.reset_password_time = null;
                return vendor.save()
            })
            .then(vendor => {
                res.status(202).json({ message: 'Password Succesfully Updated. Please login to Proceed' });
            });
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchChangePassword = (req, res, next) => {
    let loadedVendor;
    const password = req.body.password;
    const new_password = req.body.new_password;
    if (!password) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!new_password) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (password === new_password) {
        const error = new Error('Both Password can\'t be same');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            if (!vendor) {
                const error = new Error('No Vendor Found');
                error.statusCode = 204;
                throw error;
            }
            loadedVendor = vendor;
            return bcrypt.compare(password, vendor.password)
                .then(isEqual => {
                    if (!isEqual) {
                        const error = new Error('Wrong password!');
                        error.statusCode = 401;
                        throw error;
                    }
                    return bcrypt.hash(new_password, 12)
                })
                .then(hashedPassword => {
                    loadedVendor.password = hashedPassword;
                    return loadedVendor.save()
                })
                .then(vendor => {
                    res.status(202).json({ message: 'Password Succesfully Changed' });
                })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putFirebaseToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            if(token===vendor.firebase_token){
                return res.status(208).json({ message: 'Already Updated' });
            }
            vendor.firebase_token = token;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchUpdateStatus = (req, res, next) => {
    const shop_open = req.query.shop_open;
    if (shop_open == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            vendor.shop_open = shop_open;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchUpdateTime = (req, res, next) => {
    const opening_time = req.body.opening_time;
    const closing_time = req.body.closing_time;
    if (!opening_time) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!closing_time) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            vendor.opening_time = opening_time;
            vendor.closing_time = closing_time;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchUpdateLocation = (req, res, next) => {
    const location_lat = req.body.location_lat;
    const location_long = req.body.location_long;
    if (!location_lat) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!location_long) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            if (vendor.verified) {
                const error = new Error('Not allowed to update these details, talk to customer care');
                error.statusCode = 403;
                throw error;
            }
            vendor.location_lat = location_lat;
            vendor.location_long = location_long;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getProducts = (req, res, next) => {
    const offset = req.query.offset;
    const search = req.query.search;
    const order_by = req.query.order_by;
    let where; 
    let order;
    if(search){
        where= Sequelize.and({vendor_id: req.id}, Sequelize.or({name: {[Sequelize.Op.iLike] : '%'+search+'%'}}, {brand:{[Sequelize.Op.iLike] : '%'+search+'%'}}));
    }else{
        where= {vendor_id: req.id};
    }
    if(!order_by){
        order = 'createdAt';
    }else{
        order = order_by;
    }
    Product.findAll({ where: where, offset: offset, limit: 10, order: [[order, 'DESC']], })
        .then(products => {
            res.status(200).json({ message: 'Successfully Fetched', data: { products: products } });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.getProductTemplates = (req, res, next) => {
    const offset = req.query.offset;
    const search = req.query.search;
    const order_by = req.query.order_by;
    const product_category_id = req.query.product_category_id;
    let where; 
    let order;
    if(search){
        where= Sequelize.and({product_category_id: product_category_id}, Sequelize.or({name: {[Sequelize.Op.iLike] : '%'+search+'%'}}, {brand:{[Sequelize.Op.iLike] : '%'+search+'%'}}));
    }else{
        where= {product_category_id: product_category_id};
    }
    if(!order_by){
        order = 'createdAt';
    }else{
        order = order_by;
    }
    ProductTemplate.findAll({ where: where, offset: offset, limit: 10, order: [[order, 'DESC']], })
        .then(product_templates => {
            res.status(200).json({ message: 'Successfully Fetched', data: { product_templates: product_templates } });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.putProduct = (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;
    const brand = req.body.brand;
    const product_category_id = req.body.product_category_id;
    const standard_quantity_selling = req.body.standard_quantity_selling;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    const max_quantity = req.body.max_quantity;
    const tags = req.body.tags;
    // const existing_product_id = req.body.existing_product_id;
    //TODO: Manage existing products
    const images = req.files;
    console.log(images);
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!description) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!product_category_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }

    if (!standard_quantity_selling) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!mrp) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_percentage) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (discount_percentage < 0 || discount_percentage > 100) {
        const error = new Error('Discount Percentage should be between 0 and 100');
        error.statusCode = 422;
        throw error;
    }
    if (!max_quantity) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!tags) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (images.length == 0) {
        const error = new Error('Choose an Image');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    var images_json = [];
    ///Todo: Product category check if image required
    for (var i = 0; i < images.length; i++) {
        images_json.push({ "image_url": images[i].path })
    }
    console.log(images_json);

    req.vendor.createProduct({ name: name, description: description, standard_quantity_selling: standard_quantity_selling, mrp: mrp, discount_percentage: discount_percentage, max_quantity: max_quantity, tags: tags, product_category_id: product_category_id, brand: brand, images: images_json })
        .then(product => {
            return res.status(201).json({ message: 'Congrats, You have successfully added your product' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.patchProduct = (req, res, next) => {
    const product_id = req.body.product_id;
    const name = req.body.name;
    const description = req.body.description;
    const brand = req.body.brand;
    const product_category_id = req.body.product_category_id;
    const standard_quantity_selling = req.body.standard_quantity_selling;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    const max_quantity = req.body.max_quantity;
    const tags = req.body.tags;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!description) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!product_category_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }

    if (!standard_quantity_selling) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!mrp) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_percentage) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (discount_percentage < 0 || discount_percentage > 100) {
        const error = new Error('Discount Percentage should be between 0 and 100');
        error.statusCode = 422;
        throw error;
    }
    if (!max_quantity) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!tags) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to access this');
                error.statusCode = 403;
                throw error;
            }
            product.name = name;
            product.description = description;
            product.brand = brand;
            product.product_category_id = product_category_id;
            product.standard_quantity_selling = standard_quantity_selling;
            product.mrp = mrp;
            product.discount_percentage = discount_percentage;
            product.max_quantity = max_quantity;
            product.tags = tags;
            return product.save()
        })
        .then(product => {
            return res.status(200).json({ message: 'Product Details successfully updated' })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.deleteProduct = (req, res, next) => {
    const product_id = req.body.product_id;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (product.color_variants) {
                const error = new Error('You need to change the primary product color variant first');
                error.statusCode = 412;
                throw error;
            }
            for (var i = 0; i < product.images.length; i++) {
                fileHelper.deleteFile(product.images[i].image_url);
            }
            product.images = null;
            product.deleted = true;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Product successfully deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.patchProductInStock = (req, res, next) => {
    const product_id = req.body.product_id;
    const in_stock = req.body.in_stock;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (in_stock == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            product.in_stock = in_stock;
            return product.save()
        })
        .then(product => {
            return res.status(200).json({ message: 'Product Details successfully updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.deleteProductImage = (req, res, next) => {
    const image_url = req.query.image_url;
    const product_id = req.query.product_id;
    if (!image_url) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            var images_json = [];
            var flag = false;
            for (var i = 0; i < product.images.length; i++) {
                if (product.images[i].image_url === image_url) {
                    fileHelper.deleteFile(image_url);
                    flag = true;
                }
                else {
                    images_json.push({ "image_url": product.images[i].image_url })
                }
            }
            if (!flag) {
                const error = new Error('No image found with this url');
                error.statusCode = 404;
                throw error;
            }
            product.images = images_json;
            return product.save();
        })
        .then(product => {
            res.status(200).json({ message: "Image successfully deleted" });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

exports.addProductImage = (req, res, next) => {
    const product_id = req.body.product_id;
    const image = req.file;
    if (!image) {
        const error = new Error('Check for the image file');
        error.statusCode = 422;
        throw error;
    }
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const image_url = image.path;
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (product.images.length > 3) {
                const error = new Error('Maximum no. of images reached');
                error.statusCode = 406;
                throw error;
            }
            var images_json = [];
            for (var i = 0; i < product.images.length; i++) {
                images_json.push({ "image_url": product.images[i].image_url })
            }
            images_json.push({ "image_url": image_url });
            product.images = images_json;
            return product.save();
        })
        .then(product => {
            res.status(201).json({ message: "Image successfully uploaded", data: { image_url: image_url } });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putProductColor = (req, res, next) => {
    const product_id = req.body.product_id;
    const hex_color = req.body.hex_color;
    if (!product_id) {
        const error = new Error('key value error');
        error.statusCode = 422;
        throw error;
    }
    // if (!hex_color) {
    //     const error = new Error('Key value error');
    //     error.statusCode = 422;
    //     throw error;
    // }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (product.color_variants) {
                const error = new Error('Color Variant already there for the product, make a patch request');
                error.statusCode = 406;
                throw error;
            }
            var color_variants = [];
            color_variants.push({ "product_id": product_id, "value": hex_color });
            product.color_variants = color_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Color successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchProductColor = (req, res, next) => {
    const product_id = req.body.product_id;
    const hex_color = req.body.hex_color;
    if (!product_id) {
        const error = new Error('Check for the image file');
        error.statusCode = 422;
        throw error;
    }
    if (!hex_color) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.color_variants) {
                const error = new Error('There is no color variant to update, make a put request');
                error.statusCode = 406;
                throw error;
            }
            var color_variants = [];
            for (var i = 0; i < product.color_variants.length; i++) {
                if (product.color_variants[i].product_id.toString() === product_id.toString()) {
                    color_variants.push({ "product_id": product_id, "value": hex_color });
                } else {
                    color_variants.push(product.color_variants[i]);
                }
            }
            product.color_variants = color_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Color successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putProductColorVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    const hex_color = req.body.hex_color;
    const images = req.files;
    if (!images) {
        const error = new Error('Check for the image file');
        error.statusCode = 422;
        throw error;
    }
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!mrp) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_percentage) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!hex_color) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    var images_json = [];
    ///Todo: Product category check if image required
    for (var i = 0; i < images.length; i++) {
        images_json.push({ "image_url": images[i].path })
    }
    let loadedProduct;
    let color_variants = [];
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to access this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.color_variants) {
                const error = new Error('First add color to a primary product');
                error.statusCode = 406;
                throw error;
            }
            loadedProduct = product;
            for (var i = 0; i < product.color_variants.length; i++) {
                color_variants.push(product.color_variants[i]);
            }
            return req.vendor.createProduct({ name: product.name, description: product.description, standard_quantity_selling: product.standard_quantity_selling, mrp: mrp, discount_percentage: discount_percentage, max_quantity: product.max_quantity, tags: product.tags, product_category_id: product.product_category_id, brand: product.brand, images: images_json, is_primary: false })
        })
        .then(product => {
            color_variants.push({ "product_id": product.id, "value": hex_color });
            loadedProduct.color_variants = color_variants;
            return loadedProduct.save();
        })
        .then(product => {
            return res.status(201).json({ message: "Succefully Added" })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchProductColorVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const variant_product_id = req.body.variant_product_id;
    const hex_color = req.body.hex_color;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!variant_product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!hex_color) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.color_variants) {
                const error = new Error('Not a primary product');
                error.statusCode = 406;
                throw error;
            }
            var color_variants = [];
            for (var i = 0; i < product.color_variants.length; i++) {
                if (product.color_variants[i].product_id.toString() === variant_product_id.toString()) {
                    color_variants.push({ "product_id": variant_product_id, "value": hex_color });
                } else {
                    color_variants.push(product.color_variants[i]);
                }
            }
            product.color_variants = color_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteProductColorVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const variant_product_id = req.body.variant_product_id;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!variant_product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            var color_variants = [];
            for (var i = 0; i < product.color_variants.length; i++) {
                if (product.color_variants[i].product_id.toString() !== variant_product_id.toString()) {
                    color_variants.push(product.color_variants[i]);
                }
            }
            if (color_variants.length === product.color_variants.length) {
                const error = new Error('Both product are not associated to each other');
                error.statusCode = 406;
                throw error;
            }
            product.color_variants = color_variants;
            return product.save();
        })
        .then(product => {
            return Product.findByPk(variant_product_id);
        })
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.template_used) {
                product.deleted = true;
                return product.save();
            }
            for (var i = 0; i < product.images.length; i++) {
                fileHelper.deleteFile(product.images[i].image_url);
            }
            product.deleted = true;
            product.images = null;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Successfully Deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchPrimaryProductColorVariant = (req, res, next) => {
    const old_primary_product_id = req.body.old_primary_product_id;
    const new_primary_product_id = req.body.new_primary_product_id;
    if (!old_primary_product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!new_primary_product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let color_variants;
    Product.findByPk(old_primary_product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            for (var i = 0; i < product.color_variants.length; i++) {
                if (product.color_variants[i].product_id.toString() === new_primary_product_id.toString()) {
                    color_variants = product.color_variants;
                    product.is_primary = false;
                    product.color_variants = null;
                    return product.save();
                }
            }
            const error = new Error('Both products are not associated to each other');
            error.statusCode = 404;
            throw error;
        })
        .then(product => {
            return Product.findByPk(new_primary_product_id);
        })
        .then(product => {
            product.is_primary = true;
            product.color_variants = color_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Primary Color variant updated' })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putRelatedProducts = (req, res, next) => {
    const product_id = req.body.product_id;
    const list_related_product_id = req.body.list_related_product_id;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!list_related_product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!list_related_product_id.length) {
        const error = new Error('Needs to be an array');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            product.related_products = list_related_product_id;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Related product list updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putProductSizeVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const size = req.body.size;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!size) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!mrp) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_percentage) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            var size_variants = [];
            if (!product.size_variants) {
                size_variants.push({ "size": size, "mrp": mrp, "discount_percentage": discount_percentage, "in_stock": true });
                product.size_variants = size_variants;
                return product.save();
            }
            for (var i = 0; i < product.size_variants.length; i++) {
                if (product.size_variants[i].size.toString() === size.toString()) {
                    const error = new Error('Size already there');
                    error.statusCode = 409;
                    throw error;
                }
                size_variants.push(product.size_variants[i]);
            }
            size_variants.push({ "size": size, "mrp": mrp, "discount_percentage": discount_percentage, "in_stock": true });
            product.size_variants = size_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Size successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchProductSizeVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const size = req.body.size;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!size) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!mrp) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_percentage) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.size_variants) {
                const error = new Error('No size is defined here make a put request');
                error.statusCode = 406;
                throw error;
            }
            var size_variants = [];
            for (var i = 0; i < product.size_variants.length; i++) {
                if (product.size_variants[i].size.toString() === size.toString()) {
                    size_variants.push({ "size": size, "mrp": mrp, "discount_percentage": discount_percentage, "in_stock": product.size_variants[i].in_stock });
                } else {
                    size_variants.push(product.size_variants[i]);
                }
            }
            product.size_variants = size_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Size successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteProductSizeVariant = (req, res, next) => {
    const product_id = req.body.product_id;
    const size = req.body.size;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!size) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.size_variants) {
                const error = new Error('No size is defined here');
                error.statusCode = 406;
                throw error;
            }
            var size_variants = [];
            for (var i = 0; i < product.size_variants.length; i++) {
                if (product.size_variants[i].size.toString() !== size.toString()) {
                    size_variants.push(product.size_variants[i]);
                }
            }
            if (product.size_variants.length === size_variants.length) {
                const error = new Error('Both sized doesn\'t belong to the product');
                error.statusCode = 406;
                throw error;
            }
            product.size_variants = size_variants;
            return product.save();
        })
        .then(product => {
            return res.status(200).json({ message: 'Size Successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchProductSizeVariantInStock = (req, res, next) => {
    const product_id = req.body.product_id;
    const size = req.body.size;
    const in_stock = req.body.in_stock;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!size) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (in_stock == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found');
                error.statusCode = 404;
                throw error;
            }
            if (product.vendor_id.toString() !== req.id) {
                const error = new Error('You are not allowed to delete this');
                error.statusCode = 403;
                throw error;
            }
            if (!product.size_variants) {
                const error = new Error('No size is defined here');
                error.statusCode = 406;
                throw error;
            }
            var size_variants = [];
            for (var i = 0; i < product.size_variants.length; i++) {
                if (product.size_variants[i].size.toString() === size.toString()) {
                    size_variants.push({ "size": size, "mrp": product.mrp, "discount_percentage": product.discount_percentage, "in_stock": in_stock });
                } else {
                    size_variants.push(product.size_variants[i]);
                }
            }
            product.size_variants = size_variants;
            return product.save();
        })
        .then(product => {
            res.status(200).json({ message: 'Size Successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.orderPacked = (req, res, next) => {
    const order_id = req.body.order_id;
    if (!order_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Order.findByPk(order_id)
        .then(order => {
            if (!order) {
                const error = new Error('Order not found');
                error.statusCode = 404;
                throw error;
            }
            if (order.vendor_id.toString() !== req.id.toString()) {
                const error = new Error('Not Allowed');
                error.statusCode = 403;
                throw error;
            }
            if (order.cancelled) {
                const error = new Error('This order has been cancelled');
                error.statusCode = 406;
                throw error;
            }
            order.status = 'packed';
            order.packed_at = Sequelize.literal('CURRENT_TIMESTAMP');
            return order.save();
        })
        .then(order => {
            res.status(200).json({ message: 'Order Successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.orderConfirmed = (req, res, next) => {
    const order_id = req.body.order_id;
    if (!order_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Order.findByPk(order_id)
        .then(order => {
            if (!order) {
                const error = new Error('Order not found');
                error.statusCode = 404;
                throw error;
            }
            if (order.vendor_id.toString() !== req.id.toString()) {
                const error = new Error('Not Allowed');
                error.statusCode = 403;
                throw error;
            }
            if (order.cancelled) {
                const error = new Error('This order has been cancelled');
                error.statusCode = 406;
                throw error;
            }
            if(order.status!=='Pending'){
                const error = new Error('Order already confirmed');
                error.statusCode = 406;
                throw error;
            }
            order.status = 'Confirmed';
            return order.save();
        })
        .then(order => {
            res.status(200).json({ message: 'Order Successfully Confirmed' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.orderCancel = (req, res, next) => {
    const order_id = req.body.order_id;
    const cancellation_reason = req.body.cancellation_reason;
    if (!order_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!cancellation_reason) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Order.findByPk(order_id)
        .then(order => {
            if (!order) {
                const error = new Error('Order not found');
                error.statusCode = 404;
                throw error;
            }
            if (order.vendor_id.toString() !== req.id.toString()) {
                const error = new Error('Not Allowed');
                error.statusCode = 403;
                throw error;
            }
            if (order.cancelled) {
                const error = new Error('This order has been cancelled already by Customer');
                error.statusCode = 406;
                throw error;
            }
            order.status = 'Cancelled';
            order.cancelled = true;
            order.cancellation_reason = cancellation_reason;
            return order.save();
        })
        .then(order => {
            res.status(200).json({ message: 'Order Successfully Cancelled' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getProductCategories = (req, res, next) => {
    const vendor_type = req.query.vendor_type;
    if (!vendor_type) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    ProductCategory.findAll({ where: { vendor_type_id: vendor_type } })
        .then(productCategories => {
            if (!productCategories) {
                const error = new Error('No Categories Found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({ message: 'Successfully Fetched', data: { product_categories: productCategories } });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.getDashboard = (req, res, next) => {
    let ordersList;
    Order.findAll({ where: { vendor_id: req.vendor.id, status: Sequelize.or({[Sequelize.Op.eq] : 'Pending' }, {[Sequelize.Op.eq] : 'Confirmed' }), }, order: [['createdAt', 'DESC']], } )
    .then(orders=>{
        res.status(200).json({message: 'Successfully fetched', data:{orders: orders, rating:{rating_stars:req.vendor.rating_stars, no_of_ratings: req.vendor.no_of_ratings, rating:req.vendor.rating}}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getOrderRevenueDashboard = (req, res, next) => {
    const duration = req.query.duration;
    let amount;
    let start_date;
    let end_date;
    let where;
    if(duration=='RevenueDuration.TODAY'){
        end_date = new Date();
        start_date = new Date();
        start_date.setDate(start_date.getDate()-1);
        start_date.setHours(start_date.getHours()+5);
        start_date.setMinutes(start_date.getMinutes()+30);
        start_date = start_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }, createdAt: { [Sequelize.Op.lt]: end_date, [Sequelize.Op.gt]: start_date}};
    }else if(duration=='RevenueDuration.YESTERDAY'){
        end_date = new Date();
        end_date.setDate(end_date.getDate()-1);
        end_date.setHours(end_date.getHours()+5);
        end_date.setMinutes(end_date.getMinutes()+30);
        end_date = end_date.toISOString().split('T')[0]+'T18:30:00.000Z';
        start_date = new Date();
        start_date.setDate(start_date.getDate()-2);
        start_date.setHours(start_date.getHours()+5);
        start_date.setMinutes(start_date.getMinutes()+30);
        start_date = start_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }, createdAt: { [Sequelize.Op.lt]: end_date, [Sequelize.Op.gt]: start_date}};
    }else if(duration=='RevenueDuration.LAST7DAYS'){
        end_date = new Date();
        start_date = new Date();
        start_date.setDate(start_date.getDate()-7);
        start_date.setHours(start_date.getHours()+5);
        start_date.setMinutes(start_date.getMinutes()+30);
        start_date = start_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }, createdAt: { [Sequelize.Op.lt]: end_date, [Sequelize.Op.gt]: start_date}};
    }else if(duration=='RevenueDuration.MONTH'){
        end_date = new Date();
        start_date = new Date()
        start_date.setDate(1);
        start_date.setDate(start_date.getDate()-1);
        start_date.setHours(start_date.getHours()+5);
        start_date.setMinutes(start_date.getMinutes()+30);
        start_date = start_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }, createdAt: { [Sequelize.Op.lt]: end_date, [Sequelize.Op.gt]: start_date}};
    }else if(duration=='RevenueDuration.LAST_MONTH'){
        end_date = new Date()
        end_date.setDate(1);
        end_date.setDate(end_date.getDate()-1);
        end_date.setHours(end_date.getHours()+5);
        end_date.setMinutes(end_date.getMinutes()+30);
        end_date = end_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        start_date = new Date()
        start_date.setMonth(start_date.getMonth()-1);
        start_date.setDate(1);
        start_date.setDate(start_date.getDate()-1);
        start_date.setHours(start_date.getHours()+5);
        start_date.setMinutes(start_date.getMinutes()+30);
        start_date = start_date.toISOString().split('T')[0]+'T18:30:00.000Z';

        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }, createdAt: { [Sequelize.Op.lt]: end_date, [Sequelize.Op.gt]: start_date}};
    }else{
        where = {vendor_id: req.vendor.id, status: {[Sequelize.Op.eq] : 'Completed' }};
    }
    Order.sum('amount', {where: where})
    .then(sum=>{
        amount = sum;
        return Order.count({where: where});
    })
    .then(count=>{
        res.status(200).json({message: 'Successfully fetched', data:{revenue: amount, order_count:count}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getOrders = (req, res, next) => {
    const status = req.query.status;
    const offset = req.query.offset;
    Order.findAndCountAll({ where: {vendor_id: req.vendor.id, status: status}, offset: offset, limit: 5 , order: [['createdAt', 'DESC']]} )
    .then(orders=>{
        console.log(orders);
        res.status(200).json({message: 'Successfully fetched', data:{orders: orders}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getOrder = (req, res, next) => {
    const order_id = req.query.order_id;
    Order.findByPk(order_id)
    .then(order=>{
        res.status(200).json({message: 'Successfully fetched', data:{order: order}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getReviews = (req, res, next) => {
    const offset = req.query.offset;
    const rating = req.query.rating;
    let ratingFilter;
    if(rating){
        ratingFilter = {[Sequelize.Op.eq] : rating}
    }else{
        ratingFilter = {[Sequelize.Op.ne] : null}
    }
    Order.findAndCountAll({attributes:['id', 'amount', 'units', 'delivered_at', 'rating', 'review', 'products'], where: {vendor_id: req.vendor.id, rating: ratingFilter}, offset:offset, limit:10, order: [['delivered_at', 'DESC']]} )
    .then(reviews=>{
        console.log(reviews);
        res.status(200).json({message: 'Successfully fetched', data:{reviews: reviews}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.postComplaint = (req, res, next) => {
    const contact_info = req.body.contact_info;
    const reason = req.body.reason;
    const complaint = req.body.complaint;
    if(!contact_info){
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    req.vendor.createComplaint({complaint:complaint, reason:reason, contact_info:contact_info})
    .then(complaint=>{
        res.status(200).json({message: 'Your request has been submitted, We will contact you shortly, Thanks for your patience'})
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.putBanner = (req, res, next) => {
    const image = req.file;
    if (!image) {
        const error = new Error('Check for the image file');
        error.statusCode = 422;
        throw error;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const image_url = image.path;
    let banner_json = [];
    if(!req.vendor.banners){
        banner_json.push({"url": image_url});
        req.vendor.banners = banner_json;
        req.vendor.save()
        .then(vendor=>{
            res.status(201).json({message: 'Banner Uploaded', data: {banner_url: image_url}});
        })
        .catch(err => {
            if (!err.statusCode) {
                console.log(err);
                err.statusCode = 500;
                err.message = err.message;
            }
            next(err);
        });
    }else{
        if (req.vendor.banners.length > 4) {
            const error = new Error('Maximum no. of images reached');
            error.statusCode = 406;
            throw error;
        }
        for (let i = 0; i < req.vendor.banners.length; i++) {
            banner_json.push({ "url": req.vendor.banners[i].url })
        }
        banner_json.push({ "url": image_url });
        req.vendor.banners = banner_json;
        req.vendor.save()
        .then(vendor=>{
            res.status(201).json({message: 'Banner Uploaded', data: {banner_url: image_url}});
        })
        .catch(err => {
            if (!err.statusCode) {
                console.log(err);
                err.statusCode = 500;
                err.message = err.message;
            }
            next(err);
        });
    }
    
};

exports.deleteBanner = (req, res, next) => {
    const banner_url = req.query.banner_url;
    var banner_json = [];
    var flag = false;
    if(!req.vendor.banners){
        const error = new Error('No Banners');
        error.statusCode = 406;
        throw error;
    }
    for (var i = 0; i < req.vendor.banners.length; i++) {
        if (req.vendor.banners[i].url === banner_url) {
            fileHelper.deleteFile(banner_url);
            flag = true;
        }
        else {
            banner_json.push({ "url": req.vendor.banners[i].url })
        }
    }
    if (!flag) {
        const error = new Error('No image found with this url');
        error.statusCode = 404;
        throw error;
    }
    req.vendor.banners = banner_json;
    req.vendor.save()
    .then(vendor=>{
        res.status(200).json({message:'Banner has been deleted'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.putNotification = (req,res,next)=>{
    const title = req.body.title;
    const body = req.body.body;
    const action = req.body.action;
    req.vendor.createNotification({title:title, body:body, action:action})
    .then(notification=>{
        res.status(200).json({message:'Notificaton Created'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getNotification = (req,res,next)=>{
    Notification.findAll({where: {vendor_id: req.id}})
    .then(notifications=>{
        res.status(200).json({message: 'Notification Fetched', data: {notifications: notifications}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.deleteNotifications = (req,res,next) =>{
    Notification.destroy({where: {vendor_id: req.id}})
    .then(result=>{
        res.status(200).json({message: 'Notification Deleted',});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getHelpTabs = (req,res,next)=>{
    const tabs = [
        'Product Search',
        'Fees and Proceeds',
        'Inventory and Listings',
        'Orders',
        'Returns',
        'Communications',
        'Settings',
        'Frequently Asked Questions',
        'Terms and Conditions'
      ];
    res.status(200).json({tabs: tabs});
};

exports.getHelpContent = (req, res, next) =>{
    const index = req.query.index;
    if(!index){
        const error = new Error('No Index Specified');
        error.statusCode = 406;
        throw error;
    }
    fs.readFile('help/help'+index+'.txt', 'utf8', (err, data)=>{
        if(!err){
            res.status(200).json({content: data});
        }else{
            if (!err.statusCode) {
                console.log(err);
                err.statusCode = 500;
                err.message = err.message;
            }
            next(err);
        }
    })
};

exports.putCoupon = (req, res, next)=>{
    const name = req.body.name;
    const description = req.body.description;
    const code = req.body.code;
    const discount_percentage = req.body.discount_percentage;
    const max_discount = req.body.max_discount;
    const min_order = req.body.min_order;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const applicability = req.body.applicability;
    const applicable_on = req.body.applicable_on;
    if(!name){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!description){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!code){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!discount_percentage){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!max_discount){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!min_order){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!start_date){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!end_date){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!applicability){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    req.vendor.createCoupon({name: name, description: description, code: code, discount_percentage: discount_percentage, max_discount:max_discount, min_order:min_order,start_date:start_date, end_date:end_date,applicability:applicability,applicable_on:applicable_on})
    .then(vendor=>{
        res.status(200).json({message: 'Coupon created Successfully'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });

};

exports.patchCoupon = (req, res, next)=>{
    const name = req.body.name;
    const description = req.body.description;
    const code = req.body.code;
    const discount_percentage = req.body.discount_percentage;
    const max_discount = req.body.max_discount;
    const min_order = req.body.min_order;
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const applicability = req.body.applicability;
    const applicable_on = req.body.applicable_on;
    const coupon_id = req.body.coupon_id;
    if(!coupon_id){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!name){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!description){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!code){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!discount_percentage){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!max_discount){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!min_order){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!start_date){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!end_date){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    if(!applicability){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    Coupon.findByPk(coupon_id)
    .then(coupon=>{
        coupon.name = name;
        coupon.description = description;
        coupon.code = code;
        coupon.discount_percentage = discount_percentage;
        coupon.max_discount = max_discount;
        coupon.min_order = min_order;
        coupon.start_date = start_date;
        coupon.end_date = end_date;
        coupon.applicability = applicability;
        coupon.applicable_on = applicable_on;
        return coupon.save();
    })
    .then(coupon=>{
        res.status(200).json({message: 'Coupon updated successfully'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
}

exports.deleteCoupon = (req, res, next) =>{
    const coupon_id = req.query.coupon_id;
    if(!coupon_id){
        const error = new Error('Key Value error');
        error.statusCode = 422;
        throw error;
    }
    Coupon.findByPk(coupon_id)
    .then(coupon=>{
        coupon.deleted = true;
        return coupon.save();
    })
    .then(result=>{
        res.status(200).json({message: 'Coupon deleted successfully'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.getCoupons = (req, res, next) =>{
    Coupon.findAll({where: {vendor_id: req.id, deleted: false}})
    .then(coupons=>{
        res.status(200).json({message: 'Successfully Fetched', data: {coupons: coupons}});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};

exports.patchCouponIsLive = (req, res, next) =>{
    const coupon_id = req.body.coupon_id;
    const is_live = req.body.is_live;
    Coupon.findByPk(coupon_id)
    .then(coupon=>{
        coupon.is_live = is_live;
        return coupon.save();
    })
    .then(coupon=>{
        res.status(200).json({message: 'Successfully Updated'});
    })
    .catch(err => {
        if (!err.statusCode) {
            console.log(err);
            err.statusCode = 500;
            err.message = err.message;
        }
        next(err);
    });
};