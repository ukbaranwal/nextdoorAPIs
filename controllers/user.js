const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Product = require('../models/product');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('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');

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
    User.findOne({ where: { email: email } }).then(user => {
        if (user) {
            return res.status(200).json({ message: 'User already Registered' });
        }
        return bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                return User.create({ name: name, email: email, phone: phone, city: city, password: hashedPassword, device_id: device_id });
            })
            .then(user => {
                res.status(201).json({ message: 'User created!' });
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
    let loadedUser;
    User.findOne({ where: { email: email } }).then(user => {
        if (!user) {
            const error = new Error('User with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password, user.password)
            .then(isEqual => {
                if (!isEqual) {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    throw error;
                }
                const token = jwt.sign(
                    {
                        email: loadedUser.email,
                        id: loadedUser.id.toString()
                    },
                    'somesupersecretsecret',
                );
                loadedUser.password = null;
                res.status(202).json({ token: 'Bearer ' + token, user: loadedUser });
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
    User.findOne({ where: { email: email } })
        .then(user => {
            if (!user) {
                const error = new Error('A user with this email could not be found.');
                error.statusCode = 204;
                throw error;
            }
            resetPin = Math.floor(Math.random() * 10000);
            sgMail.send({
                to: user.email,
                from: 'ukbaranwal@gmail.com',
                subject: 'Request to Reset Password',
                html: '<h1>Enter this four digit pin ' + resetPin + ' to reset your password</h1>'
            });
            user.reset_password_token = resetPin;
            user.reset_password_time = Date.now() + 3600000;
            return user.save()
        })
        .then(user => {
            res.status(200).json({ message: 'Mail sent at ' + user.email });
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

    User.findOne({ where: { email: email } }).then(user => {
        if (!user) {
            const error = new Error('A user with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        if (!user.reset_password_token) {
            const error = new Error('Please request a new pin to change your password');
            error.statusCode = 401;
            throw error;
        }
        if (user.reset_password_token.toString() !== resetPin.toString()) {
            const error = new Error('Enter Correct Pin to reset your password');
            error.statusCode = 401;
            throw error;
        }
        if (user.reset_password_time < Date.now()) {
            const error = new Error('This pin has expired, please request for new one');
            error.statusCode = 401;
            throw error;
        }
        bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                user.password = hashedPassword;
                user.reset_password_token = null;
                user.reset_password_time = null;
                return user.save()
            })
            .then(user => {
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
    let loadedUser;
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
    User.findOne({ where: { id: req.id } })
        .then(user => {
            if (!user) {
                const error = new Error('No User Found');
                error.statusCode = 204;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password)
                .then(isEqual => {
                    if (!isEqual) {
                        const error = new Error('Wrong password!');
                        error.statusCode = 401;
                        throw error;
                    }
                    return bcrypt.hash(new_password, 12)
                })
                .then(hashedPassword => {
                    loadedUser.password = hashedPassword;
                    return loadedUser.save()
                })
                .then(user => {
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

exports.patchUpdateDashboard = (req, res, next) => {
    const name = req.body.name;
    const phone = req.body.phone;
    const city = req.body.city;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    User.findOne({ where: { id: req.id } })
        .then(user => {
            if (user.verified) {
                const error = new Error('Not allowed to update these details, talk to customer care');
                error.statusCode = 403;
                throw error;
            }
            user.name = name;
            user.phone = phone;
            user.city = city;
            return user.save();
        })
        .then(user => {
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    User.findOne({ where: { id: req.id } })
        .then(user => {
            user.location_lat = location_lat;
            user.location_long = location_long;
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchCart = (req, res, next) =>{
    const product_id = req.body.product_id;
    const quantity = req.body.quantity;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let cart = [];
    User.findByPk(req.id)
    .then(user =>{
        if(!user){
            const error = new Error('No User Found');
            error.statusCode = 204;
            throw error;
        }
        let flag = false;
        if(user.cart){
            for(let i=0; i<user.cart.length; i++){
                if(user.cart[i].product_id.toString()===product_id.toString()){
                    cart.push({'product_id':product_id, 'quantity':quantity})
                    flag=true;
                }else{
                    cart.push(user.cart[i]);
                }
            }
        }
        if(!flag){
            cart.push({'product_id':product_id, 'quantity':quantity});
        }
        user.cart = cart;
        return user.save();
    })
    .then(user=>{
        res.status(200).json({ message: 'Cart Succesfully Updated' });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.putAddress = (req,res,next)=>{
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const postcode = req.body.postcode;
    const landmark = req.body.landmark;
    const phone = req.body.phone;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let address_json = [];
    User.findByPk(req.id)
    .then(user =>{
        if(!user){
            const error = new Error('No User Found');
            error.statusCode = 204;
            throw error;
        }
        let addressLength;
        if(user.address){
            for(let i=0; i<user.address.length; i++){
                address_json.push(user.address[i]);
            }
            addressLength = user.address.length + 1;
        }else{
            addressLength = 1;
        }
        if(addressLength>5){
            const error = new Error('Max no. of address reached');
            error.statusCode = 406;
            throw error;
        }
        address_json.push({"id":addressLength, "name":name, "address":address, "city":city, "postcode": postcode, "landmark":landmark, "phone":phone })
        user.address = address_json;
        return user.save();
    })
    .then(user=>{
        res.status(200).json({ message: 'Address Succesfully Updated' });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.patchAddress = (req,res,next)=>{
    const address_id = req.body.address_id;
    const name = req.body.name;
    const address = req.body.address;
    const city = req.body.city;
    const postcode = req.body.postcode;
    const landmark = req.body.landmark;
    const phone = req.body.phone;
    if (!address_id) {
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
    let address_json = [];
    User.findByPk(req.id)
    .then(user =>{
        if(!user){
            const error = new Error('No User Found');
            error.statusCode = 204;
            throw error;
        }
        if(user.address){
            for(let i=0; i<user.address.length; i++){
                if(user.address[i].id.toString()===address_id.toString()){
                    address_json.push({"id":address_id, "name":name, "address":address, "city":city, "postcode": postcode, "landmark":landmark, "phone":phone })
                }else{
                    address_json.push(user.address[i]);
                }
            }
        }
        user.address = address_json;
        return user.save();
    })
    .then(user=>{
        res.status(200).json({ message: 'Address Succesfully Updated' });
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};



// exports.putOrder = (req, res, next) => {
//     const paid = req.body.paid;
//     const transaction_id = req.body.transaction_id;
//     const amount = req.body.amount;
//     const amount_paid_by_wallet = req.body.amount_paid_by_wallet;
//     const amount_due = req.body.amount_due;
//     const discount_applied = req.body.discount_applied;
//     const vendor_id = req.body.vendor_id;
//     // const coupon_applied = req.body.coupon_applied;
//     // const coupon_id = req.body.coupon_id;
//     // const coupon_discount = req.body.coupon_discount;
//     const payment_method = req.body.payment_method;
//     // const cashback = req.body.cashback;
//     const delivery_charge = req.body.delivery_charge;
//     const units = req.body.units;
//     const instructions = req.body.instructions;
//     const address = req.body.address;
//     const products = req.body.products;//[{id:1, quantity:2}]
//     if (paid==null) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }else if(paid.toString()==='true' && !transaction_id){
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!amount) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (amount_paid_by_wallet==null) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!amount_due) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!discount_applied) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!vendor_id) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!payment_method) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if (!delivery_charge) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if(!units){
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if(!address){
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     if(!products){
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         throw error;
//     }
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const error = new Error('Key value error');
//         error.statusCode = 422;
//         error.data = errors.array();
//         throw error;
//     }
//     var products_id = [];
//     for(let i=0; i<products.length; i++){
//         products_id.push(products[i].product_id);
//     }
//     User.findOne({ where: { id: req.id } })
//     .then(user => {
//         if (!user) {
//             const error = new Error('User could not be found.');
//             error.statusCode = 204;
//             throw error;
//         }
//         Product.findAll({where: {id: products_id }, attributes: ['id', 'mrp', 'discount_percentage', 'name']})
//         .then(products=>{
//             if(products.length!=products_id.length){
//                 //error code
//                 const error = new Error('There are some products that doesn\'t exist');
//                 error.statusCode = 500;
//                 throw error;
//             }
//             for(var i=0; i<products.length; i++){
//                 if(products[i].vendor_id.toString()!==vendor_id.toString()){
//                     const error = new Error('There are some products that doesn\'t belong to the vendor');
//                     error.statusCode = 500;
//                     throw error;
//                 }
//             }
//         })
//     })
//         .catch(err => {
//             if (!err.statusCode) {
//                 err.statusCode = 500;
//             }
//             next(err);
//         });
// };