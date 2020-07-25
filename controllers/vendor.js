const Vendor = require('../models/vendor');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const vendor_type = req.body.vendor_type;
    const city = req.body.city;
    const password = req.body.password;
    if(!name){
        const error = new Error('Key value should be \'name\'');
        error.statusCode = 422;
        throw error;
    }
    if(!email){
        const error = new Error('Key value should be \'email\'');
        error.statusCode = 422;
        throw error;
    }
    if(!phone){
        const error = new Error('Key value should be \'phone\'');
        error.statusCode = 422;
        throw error;
    }
    if(!vendor_type){
        const error = new Error('Key value should be \'vendor_type\'');
        error.statusCode = 422;
        throw error;
    }
    if(!city){
        const error = new Error('Key value should be \'city\'');
        error.statusCode = 422;
        throw error;
    }
    if(!password){
        const error = new Error('Key value should be \'password\'');
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
                return Vendor.create({ name: name, email: email, phone: phone, city: city, password: hashedPassword, vendor_type: vendor_type });
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
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err);
            })
    })
};

exports.postSignin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    if(!email){
        const error = new Error('Key value should be \'email\'');
        error.statusCode = 422;
        throw error;
    }
    if(!password){
        const error = new Error('Key value should be \'password\'');
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
    let loadedVendor;
    Vendor.findOne({ where: { email: email } }).then(vendor => {
        if (!vendor) {
            const error = new Error('A vendor with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        loadedVendor = vendor;
        return bcrypt.compare(password, vendor.password);
    })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: loadedVendor.email,
                    vendorId: loadedVendor.id.toString()
                },
                'somesupersecretsecret',
            );
            loadedVendor.password = null;
            res.status(202).json({ token: token, vendor: loadedVendor });
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
    if(!email){
        const error = new Error('Key value should be \'email\'');
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
        return vendor;
    })
    .then(vendor => {
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
    if(!email){
        const error = new Error('Key value should be \'email\'');
        error.statusCode = 422;
        throw error;
    }
    if(!password){
        const error = new Error('Key value should be \'password\'');
        error.statusCode = 422;
        throw error;
    }
    if(!resetPin){
        const error = new Error('Key value should be \'pin\'');
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