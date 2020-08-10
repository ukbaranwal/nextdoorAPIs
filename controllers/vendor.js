const Vendor = require('../models/vendor');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fileHelper = require('../util/delete-file');
const Product = require('../models/product');
const ProductTemplate = require('../models/product_template');

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const vendor_type = req.body.vendor_type;
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
    if (!vendor_type) {
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
                return Vendor.create({ name: name, email: email, phone: phone, city: city, password: hashedPassword, vendor_type: vendor_type, device_id: device_id });
            })
            .then(vendor => {
                res.status(201).json({ message: 'Vendor created!', vendorId: vendor._id });
                return sgMail.send({
                    to: email,
                    from: 'ukbaranwal@gmail.com',
                    subject: 'Welcome to NextDoor',
                    html: '<h1>We, at Next Door welcome you to our family.</h1>'
                });
            })

    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
};

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
                res.status(202).json({ token: 'Bearer ' + token, vendor: loadedVendor });
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
        sgMail.send({
            to: vendor.email,
            from: 'ukbaranwal@gmail.com',
            subject: 'Request to Reset Password',
            html: '<h1>Enter this four digit pin ' + resetPin + ' to reset your password</h1>'
        });
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
            error.statusCode = 401;
            throw error;
        }
        if (vendor.reset_password_token.toString() !== resetPin.toString()) {
            const error = new Error('Enter Correct Pin to reset your password');
            error.statusCode = 401;
            throw error;
        }
        if (vendor.reset_password_time < Date.now()) {
            const error = new Error('This pin has expired, please request for new one');
            error.statusCode = 401;
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

exports.patchUpdateStatus = (req, res, next) => {
    const shop_open = req.body.shop_open;
    if (shop_open == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (typeof shop_open !== 'boolean') {
        const error = new Error('Value should be in Boolean');
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
    var images_json = [];
    ///Todo: Product category check if image required
    if (images) {
        for (var i = 0; i < images.length; i++) {
            images_json.push({ "image_url": images[i].path })
        }
    }
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

exports.putProductThroughTemplate = (req, res, next) => {
    const name = req.body.name;
    const description = req.body.description;
    const brand = req.body.brand;
    const product_category_id = req.body.product_category_id;
    const standard_quantity_selling = req.body.standard_quantity_selling;
    const mrp = req.body.mrp;
    const discount_percentage = req.body.discount_percentage;
    const max_quantity = req.body.max_quantity;
    const tags = req.body.tags;
    const product_template_id = req.body.product_template_id;

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
    if (template_used == null) {
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
    ProductTemplate.findByPk(product_template_id)
        .then(productTemplate => {
            if (!productTemplate) {
                const error = new Error('Template not found.');
                error.statusCode = 404;
                throw error;
            }
            return productTemplate;
        })
        .then(productTemplate => {
            return req.vendor.createProduct({ name: name, description: description, standard_quantity_selling: standard_quantity_selling, mrp: mrp, discount_percentage: discount_percentage, max_quantity: max_quantity, tags: tags, product_category_id: product_category_id, brand: brand, images: productTemplate.images, template_used: true })
        })
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
            if (product.template_used) {
                product.deleted = true;
                product.images = null;
                return product.save();
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
    const image_url = req.body.image_url;
    const product_id = req.body.product_id;
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
                    if (!product.template_used) {
                        fileHelper.deleteFile(image_url);
                    }
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
            res.status(201).json({ message: "Image successfully uploaded" });
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
            return res.status(200).json({ message: 'Size Successfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};