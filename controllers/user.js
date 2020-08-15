const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Vendor = require('../models/vendor');
const sendEmail = require('../util/send-mail').sendEmail;


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
                sendEmail(email, 'Welcome to NextDoor', '<h1>We, at Next Door welcome you to our family.</h1>');
                return res.status(201).json({ message: 'User created!' });
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
            sendEmail(user.email, 'Request to Reset Password', '<h1>Enter this four digit pin ' + resetPin + ' to reset your password</h1>');
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

exports.putFirebaseToken = (req, res, next) => {
    const token = req.body.token;
    if (!token) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    User.findOne({ where: { id: req.id } })
        .then(user => {
            user.firebase_token = token;
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

exports.patchCart = (req, res, next) => {
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
        .then(user => {
            if (!user) {
                const error = new Error('No User Found');
                error.statusCode = 204;
                throw error;
            }
            let flag = false;
            if (user.cart) {
                for (let i = 0; i < user.cart.length; i++) {
                    if (user.cart[i].product_id.toString() === product_id.toString()) {
                        cart.push({ 'product_id': product_id, 'quantity': quantity })
                        flag = true;
                    } else {
                        cart.push(user.cart[i]);
                    }
                }
            }
            if (!flag) {
                cart.push({ 'product_id': product_id, 'quantity': quantity });
            }
            user.cart = cart;
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Cart Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteCart = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    User.findByPk(req.id)
        .then(user => {
            if (!user) {
                const error = new Error('No User Found');
                error.statusCode = 204;
                throw error;
            }
            user.cart = [];
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Cart Succesfully Cleared' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putAddress = (req, res, next) => {
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
        .then(user => {
            if (!user) {
                const error = new Error('No User Found');
                error.statusCode = 204;
                throw error;
            }
            let addressLength;
            if (user.address) {
                for (let i = 0; i < user.address.length; i++) {
                    address_json.push(user.address[i]);
                }
                addressLength = user.address.length + 1;
            } else {
                addressLength = 1;
            }
            if (addressLength > 5) {
                const error = new Error('Max no. of address reached');
                error.statusCode = 406;
                throw error;
            }
            address_json.push({ "id": addressLength, "name": name, "address": address, "city": city, "postcode": postcode, "landmark": landmark, "phone": phone })
            user.address = address_json;
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Address Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchAddress = (req, res, next) => {
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
        .then(user => {
            if (!user) {
                const error = new Error('No User Found');
                error.statusCode = 204;
                throw error;
            }
            if (user.address) {
                for (let i = 0; i < user.address.length; i++) {
                    if (user.address[i].id.toString() === address_id.toString()) {
                        address_json.push({ "id": address_id, "name": name, "address": address, "city": city, "postcode": postcode, "landmark": landmark, "phone": phone })
                    } else {
                        address_json.push(user.address[i]);
                    }
                }
            }
            user.address = address_json;
            return user.save();
        })
        .then(user => {
            res.status(200).json({ message: 'Address Succesfully Updated' });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putOrder = (req, res, next) => {
    const paid = req.body.paid;
    const transaction_id = req.body.transaction_id;
    const amount = req.body.amount;
    const amount_paid_by_wallet = req.body.amount_paid_by_wallet;
    const amount_due = req.body.amount_due;
    const discount_applied = req.body.discount_applied;
    const vendor_id = req.body.vendor_id;
    // const coupon_applied = req.body.coupon_applied;
    // const coupon_id = req.body.coupon_id;
    // const coupon_discount = req.body.coupon_discount;
    const payment_method = req.body.payment_method;
    // const cashback = req.body.cashback;
    const delivery_charge = req.body.delivery_charge;
    const units = req.body.units;
    const instructions = req.body.instructions;
    const address = req.body.address;
    const products_request = req.body.products;//[{id:1, quantity:2}]
    if (paid == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    } else if (paid.toString() === 'true' && !transaction_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!amount) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (amount_paid_by_wallet == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!amount_due) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!discount_applied) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!vendor_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!payment_method) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!delivery_charge) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!units) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!address) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!products_request) {
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
    var products_id = [];
    for (let i = 0; i < products_request.length; i++) {
        products_id.push(products_request[i].product_id);
    }
    User.findOne({ where: { id: req.id } })
        .then(user => {
            if (!user) {
                const error = new Error('User could not be found.');
                error.statusCode = 204;
                throw error;
            }
            console.log(products_id);
            Product.findAll({ where: { id: products_id } })
                .then(products => {
                    if (products.length != products_id.length) {
                        //error code
                        const error = new Error('There are some products that doesn\'t exist');
                        error.statusCode = 500;
                        throw error;
                    }
                    for (var i = 0; i < products.length; i++) {
                        if (products[i].vendor_id.toString() !== vendor_id.toString()) {
                            const error = new Error('There are some products that doesn\'t belong to the vendor');
                            error.statusCode = 500;
                            throw error;
                        }
                    }
                    var products_json = [];
                    let quantity;
                    for (var i = 0; i < products.length; i++) {
                        for (var j = 0; j < products_request.length; j++) {
                            if (products_request[j].product_id.toString() === products[i].id.toString()) {
                                quantity = products_request[j].quantity;
                                break;
                            }
                        }
                        products_json.push({ product_id: products[i].id, product_name: products[i].name, product_brand: products[i].brand, amount: products[i].mrp, discount_percentage: products[i].discount_percentage, image: products[i].images[0].image_url, quantity: quantity })
                    }
                    return user.createOrder({ paid: paid, amount: amount, amount_due: amount_due, amount_paid_by_wallet: amount_paid_by_wallet, discount_applied: discount_applied, payment_method, delivery_charge: delivery_charge, units: units, transaction_id: transaction_id, instructions: instructions, status: 'ordered', address: address, products: products_json, vendor_id: vendor_id });
                })
                .then(order => {
                    ///call delete cart
                    sendEmail(user.email, 'You have successfully placed your order', 'You have successfully placed your order');
                    res.status(201).json({ message: 'Order Succesfully created', order: order });
                })
                .catch(err => {
                    if (!err.statusCode) {
                        err.statusCode = 500;
                    }
                    next(err);
                });
        })

};

exports.deleteOrder = (req, res, next) => {
    const order_id = req.body.order_id;
    if (!order_id) {
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
    Order.findByPk(order_id)
        .then(order => {
            if (!order) {
                const error = new Error('Order could not be found.');
                error.statusCode = 204;
                throw error;
            }
            if (order.user_id.toString() !== req.id.toString()) {
                const error = new Error('Order belongs to different user');
                error.statusCode = 403;
                throw error;
            }
            order.status = 'cancelled';
            order.cancelled = true;
            return order.save();
        })
        .then(order => {
            return User.findByPk(req.id);
        })
        .then(user=>{
            sendEmail(user.email, 'Your order has been cancelled', 'Your order has been cancelled');
            res.status(200).json({ message: 'Your order has been cancelled'});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putOrderReview = (req, res, next) => {
    const order_id = req.body.order_id;
    const stars = req.body.stars;
    const review = req.body.review;
    const products_review = req.body.products_review;///[{product_id:1, stars:3}]
    if (!order_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(!stars){
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(stars<1 || stars>5){
        const error = new Error('Stars should be in between 1-5');
        error.statusCode = 422;
        throw error;
    }
    let products_id = [];
    if(products_review){
        for(let i=0; i<products_review.length; i++){
            products_id.push(products_review[i].product_id);
        }
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    Order.findByPk(order_id)
        .then(order => {
            if (!order) {
                const error = new Error('Order could not be found.');
                error.statusCode = 204;
                throw error;
            }
            if (order.user_id.toString() !== req.id.toString()) {
                const error = new Error('Order belongs to different user');
                error.statusCode = 403;
                throw error;
            }
            if(order.rating){
                const error = new Error('You have already given a review');
                error.statusCode = 406;
                throw error;
            }
            order.review = review;
            order.rating = stars;
            order.product_review = products_review;
            return order.save();    
        })
        .then(order=>{
            return Vendor.findByPk(order.vendor_id);
        })
        .then(vendor => {
            vendor.rating = (vendor.rating*vendor.no_of_ratings + stars)/(vendor.no_of_ratings+1);
            vendor.rating = vendor.rating.toFixed(1);
            vendor.no_of_ratings = vendor.no_of_ratings + 1;
            let rating_stars_json = [];
            for(let i=0; i<5; i++){
                if(stars == i+1){
                    rating_stars_json.push(vendor.rating_stars[i]+1);
                }else{
                    rating_stars_json.push(vendor.rating_stars[i]);
                }
            }
            vendor.rating_stars = rating_stars_json;
            return vendor.save();
        })
        .then(vendor=>{
            return res.status(200).json({ message: 'Thanks for the review'});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putProductReview = (req, res, next) => {
    const product_id = req.body.product_id;
    const stars = req.body.stars;
    if (!product_id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(!stars){
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(stars<1 || stars>5){
        const error = new Error('Stars should be in between 1-5');
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
    Product.findByPk(product_id)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found.');
                error.statusCode = 204;
                throw error;
            }
            product.rating = (product.rating*product.no_of_ratings + stars)/(product.no_of_ratings+1);
            product.rating = product.rating.toFixed(1);
            product.no_of_ratings = product.no_of_ratings + 1;
            return product.save();    
        })
        .then(product=>{
            return res.status(200).json();
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};