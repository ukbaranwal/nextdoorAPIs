const Admin = require('../models/admin');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const VendorType = require('../models/vendor_type');
const ProductCategory = require('../models/product_category');
const fileHelper = require('../util/delete-file');
const ProductTemplate = require('../models/product_template');
const Vendor = require('../models/vendor');

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
                res.status(202).json({ token: 'Bearer '+token, admin: loadedAdmin });
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
    const vendor_type = req.vendor_type;
    if (!name) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if (!vendor_type) {
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
        return ProductCategory.create({ name: name, parent_id: parent_id, tags: tags, quantity_by_piece: quantity_by_piece, quantity_by_weight: quantity_by_weight, image_url: image_url , vendor_type : vendor_type})
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
            .then(result => {
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

exports.putProductTemplate = (req, res, next) => {
    const name = req.body.name;
    const brand = req.body.brand;
    const description = req.body.description;
    const standard_quantity_selling = req.body.standard_quantity_selling;
    const mrp = req.body.mrp;
    const tags = req.body.tags;
    const product_category_id = req.body.product_category_id;
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
    if (!tags) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(!product_category_id){
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(!images){
        return res.status(422).json({ message: 'Attached file is not an Image' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    var images_json = [];
    for(var i=0; i<images.length; i++){
        images_json.push({"image_url":images[i].path})
    }
    ProductTemplate.create({name: name, description: description, standard_quantity_selling: standard_quantity_selling, mrp: mrp,tags:tags, product_category_id:product_category_id, brand: brand, images: images_json})
    .then(productTemplate=>{
        return res.status(201).json({message: 'You have successfully added a product template'});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.patchProductTemplate = (req, res, next) => {
    const product_template_id = req.body.product_template_id;
    const name = req.body.name;
    const description = req.body.description;
    const brand = req.body.brand;
    const product_category_id = req.body.product_category_id;
    const standard_quantity_selling = req.body.standard_quantity_selling;
    const mrp = req.body.mrp;
    const tags = req.body.tags;
    if(!product_template_id){
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
    ProductTemplate.findByPk(product_template_id)
    .then(productTemplate=>{
        if(!productTemplate){
            const error = new Error('Product Template not found');
            error.statusCode = 404;
            throw error;
        }
        productTemplate.name = name;
        productTemplate.description = description;
        productTemplate.brand = brand;
        productTemplate.product_category_id = product_category_id;
        productTemplate.standard_quantity_selling = standard_quantity_selling;
        productTemplate.mrp = mrp;
        productTemplate.tags = tags;
        return productTemplate.save()
    })
    .then(productTemplate=>{
        return res.status(200).json({message:'Product template details successfully updated'})
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.deleteProductTemplateImage = (req, res, next) =>{
    const image_url = req.body.image_url;
    const product_template_id = req.body.product_template_id;
    if(!image_url){
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    if(!product_template_id){
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
    .then(productTemplate=>{
        if(!productTemplate){
            const error = new Error('Product Template not found');
            error.statusCode = 404;
            throw error;
        }
        var images_json = [];
        var flag = false;
        for(var i=0; i<productTemplate.images.length; i++){
            if(productTemplate.images[i].image_url===image_url){
                fileHelper.deleteFile(image_url);
                flag = true;
            }
            else{
                images_json.push({"image_url":productTemplate.images[i].image_url})
            }
        }
        if(!flag){
            const error = new Error('No image found with this url');
            error.statusCode = 404;
            throw error;
        }
        productTemplate.images = images_json;
        return productTemplate.save();
    })
    .then(productTemplate=>{
        res.status(200).json({message:"Image successfully deleted"});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.putProductTemplateImage = (req, res, next) =>{
    const product_template_id = req.body.product_template_id;
    const image = req.file;
    if(!image){
        const error = new Error('Check for the image file');
        error.statusCode = 422;
        throw error;
    }
    if(!product_template_id){
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
    ProductTemplate.findByPk(product_template_id)
    .then(productTemplate=>{
        if(!productTemplate){
            const error = new Error('Product not found');
            error.statusCode = 404;
            throw error;
        }
        if(productTemplate.images.length>3){
            const error = new Error('Maximum no. of images reached');
            error.statusCode = 406;
            throw error;
        }
        var images_json = [];
        for(var i=0; i<productTemplate.images.length; i++){
            images_json.push({"image_url":productTemplate.images[i].image_url})
        }
        images_json.push({"image_url":image_url});
        productTemplate.images = images_json;
        return productTemplate.save();
    })
    .then(productTemplate=>{
        res.status(201).json({message:"Image successfully uploaded"});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.patchUpdateDashboardLogo = (req, res, next) => {
    const id = req.body.id;
    const image = req.file;
    if (!image) {
        return res.status(422).json({ message: 'Attached file is not an Image' })
    }
    if (!id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
    const image_url = image.path;
    Vendor.findOne({ where: { id: id } })
        .then(vendor => {
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
    const id = req.body.id;
    Vendor.findOne({ where: { id: id } })
        .then(vendor => {
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

exports.patchUpdateDashboard = (req, res, next) => {
    const id =req.body.id;
    const name = req.body.name;
    const shop_name = req.body.shop_name;
    const address = req.body.address;
    const city = req.body.city;
    const tags = req.body.tags;
    if (!id) {
        const error = new Error('Key value error');
        error.statusCode = 422;
        throw error;
    }
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
    Vendor.findOne({ where: { id: id } })
        .then(vendor => {
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