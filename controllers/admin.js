const Admin = require('../models/admin');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const VendorType = require('../models/vendor_type');
const ProductCategory = require('../models/product_category');
const fileHelper = require('../util/delete-file');

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
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
    Admin.findOne({ where: { email: email } }).then(admin => {
        if (admin) {
            return res.status(200).json({ message: 'Admin already Registered' });
        }
        return bcrypt
            .hash(password, 12)
            .then(hashedPassword => {
                return Admin.create({ name: name, email: email, phone: phone, city: city, password: hashedPassword, address: address, device_id: device_id });
            })
            .then(admin => {
                return res.status(201).json({ message: 'Admin created!' });
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
    let loadedAdmin;
    Admin.findOne({ where: { email: email } }).then(admin => {
        if (!admin) {
            const error = new Error('An Admin with this email could not be found.');
            error.statusCode = 204;
            throw error;
        }
        loadedAdmin = admin;
        return bcrypt.compare(password, admin.password)
            .then(isEqual => {
                if (!isEqual) {
                    const error = new Error('Wrong password!');
                    error.statusCode = 401;
                    throw error;
                }
                const token = jwt.sign(
                    {
                        email: loadedAdmin.email,
                        id: loadedAdmin.id.toString(),
                        root_access: loadedAdmin.root_access
                    },
                    'somesupersecretsecretadmin',
                );
                loadedAdmin.password = null;
                res.status(202).json({ token: token, admin: loadedAdmin });
            })

    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.putVendorType = (req, res, next) => {
    const name = req.body.name;
    const service = req.body.service;
    const selling = req.body.selling;
    const delivery_boy_needed = req.body.delivery_boy_needed;
    const store_needed = req.body.store_needed;
    const image = req.file;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (service == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (selling == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (delivery_boy_needed == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (store_needed == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (selling == service) {
        const error = new Error('Category should either be selling or service');
        error.statusCode = 422;
        throw error;
    }
    if (!image) {
        return res.status(422).json({ message: 'Attached file is not an Image' })
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const image_url = image.path;
    VendorType.findOne({ where: { name: name } }).then(vendorType => {
        if (vendorType) {
            return res.status(200).json({ message: 'Category already exist' });
        }
        return VendorType.create({ name: name, service: service, selling: selling, delivery_boy_needed: delivery_boy_needed, store_needed: store_needed, image_url: image_url })
            .then(vendorType => {
                res.status(201).json({ message: "Category added" });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchVendorType = (req, res, next) => {
    const id = req.body.id;
    const name = req.body.name;
    const service = req.body.service;
    const selling = req.body.selling;
    const delivery_boy_needed = req.body.delivery_boy_needed;
    const store_needed = req.body.store_needed;
    const image = req.file;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (service == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (selling == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (delivery_boy_needed == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (store_needed == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (selling == service) {
        const error = new Error('Category should either be selling or service');
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
    VendorType.findOne({ where: { id: id } }).then(vendorType => {
        if (!vendorType) {
            const error = new Error('Could not find category.');
            error.statusCode = 404;
            throw error;
        }
        vendorType.name = name;
        vendorType.service = service;
        vendorType.selling = selling;
        vendorType.delivery_boy_needed = delivery_boy_needed;
        vendorType.store_needed = store_needed;
        if (vendorType.image_url && image) {
            fileHelper.deleteFile(vendorType.image_url);
            vendorType.image_url = image.path;
        } else if (image) {
            vendorType.image_url = image.path;
        }
        return vendorType.save()
            .then(vendorType => {
                res.status(200).json({ message: "Category updated" });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });

};



exports.deleteVendorType = (req, res, next) => {
    const id = req.body.id;
    if (!id) {
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
    VendorType.findByPk(id).then(vendorType => {
        if (!vendorType) {
            const error = new Error('Could not find category.');
            error.statusCode = 404;
            throw error;
        }
        if (vendorType.image_url) {
            fileHelper.deleteFile(vendorType.image_url);
        }
        return vendorType.destroy()
            .then(result => {
                res.status(200).json({ message: 'Category Deleted' });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.putProductCategory = (req, res, next) => {
    const name = req.body.name;
    let parent_id = req.body.parent_id;
    const tags = req.body.selling;
    const quantity_by_weight = req.body.quantity_by_weight;
    const quantity_by_piece = req.body.quantity_by_piece;
    const image = req.file;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_weight == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_piece == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_piece == quantity_by_weight) {
        const error = new Error('Selling quantity should either be piece or weight');
        error.statusCode = 422;
        throw error;
    }
    if (!parent_id) {
        parent_id = 0;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    let image_url;
    if (image) {
        image_url = image.path;
    }
    ProductCategory.findOne({ where: { name: name, parent_id: parent_id } }).then(productCategory => {
        if (productCategory) {
            return res.status(200).json({ message: 'Product Category already exist' });
        }
        return ProductCategory.create({ name: name, parent_id: parent_id, tags: tags, quantity_by_piece: quantity_by_piece, quantity_by_weight: quantity_by_weight, image_url: image_url })
            .then(productCategory => {
                res.status(201).json({ message: "Product Category added" });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.patchProductCategory = (req, res, next) => {
    const id = req.body.id;
    const name = req.body.name;
    const tags = req.body.selling;
    const quantity_by_weight = req.body.quantity_by_weight;
    const quantity_by_piece = req.body.quantity_by_piece;
    const image = req.file;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_weight == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_piece == null) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (quantity_by_piece == quantity_by_weight) {
        const error = new Error('Selling quantity should either be piece or weight');
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
    let image_url;
    if (image) {
        image_url = image.path;
    }
    ProductCategory.findByPk(id).then(productCategory => {
        if (!productCategory) {
            const error = new Error('Could not find product category.');
            error.statusCode = 404;
            throw error;
        }
        productCategory.name = name;
        productCategory.quantity_by_piece = quantity_by_piece;
        productCategory.quantity_by_weight = quantity_by_weight;
        productCategory.tags = tags;
        if (productCategory.image_url && image) {
            fileHelper.deleteFile(productCategory.image_url);
            productCategory.image_url = image_url;
        } else if (image) {
            productCategory.image_url = image_url;
        }
        return productCategory.save()
            .then(productCategory => {
                res.status(200).json({ message: "Product Category updated" });
            })
    })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.deleteProductCategory = (req, res, next) => {
    const id = req.body.id;
    if (!id) {
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
    ProductCategory.findByPk(id).then(productCategory => {
        if (!productCategory) {
            const error = new Error('Could not find product category.');
            error.statusCode = 404;
            throw error;
        }
        if (productCategory.image_url) {
            fileHelper.deleteFile(productCategory.image_url);
        }
        return productCategory.destroy()
        .then(result=>{
            res.status(200).json({ message: 'Product Category Deleted' });
        })
    })
        
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};