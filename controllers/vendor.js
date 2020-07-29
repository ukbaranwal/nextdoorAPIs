const Vendor = require('../models/vendor');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fileHelper = require('../util/delete-file');

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
                res.status(202).json({ token: token, vendor: loadedVendor });
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
        return vendor
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

exports.putChangePassword = (req, res, next) => {
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

exports.putUpdateStatus = (req, res, next) => {
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

exports.putUpdateDashboardLogo = (req, res, next) => {
    const image = req.file;
    if (!image) {
        return res.status(422).json({ message: 'Attached file is not an Image' })
    }
    const image_url = image.path;
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            if (vendor.verified) {
                const error = new Error('Not allowed to update these details, talk to customer care');
                error.statusCode = 403;
                fileHelper.deleteFile(image_url);
                throw error;
            }
            if (vendor.image_url) {
                fileHelper.deleteFile(vendor.image_url);
            }
            vendor.image_url = image_url;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Uploaded' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteDashboardLogo = (req, res, next) => {
    Vendor.findOne({ where: { id: req.id } })
        .then(vendor => {
            if (vendor.verified) {
                const error = new Error('Not allowed to update these details, talk to customer care');
                error.statusCode = 403;
                throw error;
            }
            if (!vendor.image_url) {
                const error = new Error('No logo');
                error.statusCode = 204;
                throw error;
            }
            fileHelper.deleteFile(vendor.image_url);
            vendor.image_url = null;
            return vendor.save();
        })
        .then(vendor => {
            res.status(200).json({ message: 'Succesfully Deleted' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putUpdateDashboard = (req, res, next) => {
    const name = req.body.name;
    const shop_name = req.body.shop_name;
    const address = req.body.address;
    const city = req.body.city;
    const tags = req.body.tags;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!shop_name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!address) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!city) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!tags) {
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
            vendor.name = name;
            vendor.shop_name = shop_name;
            vendor.address = address;
            vendor.city = city;
            vendor.tags = tags;
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

exports.putUpdateTime = (req, res, next) => {
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

exports.putUpdateLocation = (req, res, next) => {
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
}