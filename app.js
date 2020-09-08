const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
const sequelize = require('./util/database');
const firebaseAdmin = require('./util/send_push_notifications');


//Routers
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/user');
const vendorsRouter = require('./routes/vendor');
const adminsRouter = require('./routes/admin');

//Models
const Product = require('./models/product');
const Vendor = require('./models/vendor');
const ProductCategory = require('./models/product_category');
const ProductTemplate = require('./models/product_template');
const Order = require('./models/order');
const User = require('./models/user');
const VendorType = require('./models/vendor_type');
const Notification = require('./models/notification');

///Helper to delete files
const fileHandler = require('./util/delete-file');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

//exposes folders to public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/', indexRouter);
//Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/users', usersRouter);
app.use('/vendors', vendorsRouter);
app.use('/admins', adminsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message;
  const data = err.data;

  //If error's thrown delete files that got stored
  if(req.files){
    for(var i=0; i<req.files.length; i++){
      fileHandler.deleteFile(req.files[i].path);
    }
  }
  if(req.file){
    fileHandler.deleteFile(req.file.path);
  }
  res.status(status).json({ message: message, data: data });
});

firebaseAdmin.initializeFirebaseApp();

// firebaseAdmin.sendPushNotification('cMmphpoxTjizgqORaNDdcf:APA91bGOaGbIM0OljybaRB40YOJ5hORLY65Fdq1eqVP9kA1HB4H8yrgx1lpB4P5XqO3UQxZP4BcHf-B6sbNl3kViK3Q922XfbkabWjmtvbtrLp3tQKLDMaG_lOgIxV-PAvbOx7oNTW71', "Hey it Works", "yeuppp");

//Associations
//Product has a foreign key product_category_id
Product.belongsTo(ProductCategory, {foreignKey: 'product_category_id'});
ProductCategory.hasMany(Product, {foreignKey: 'product_category_id'});
//Product has a foreign key vendor_id
Product.belongsTo(Vendor, {foreignKey: 'vendor_id'});
Vendor.hasMany(Product, {foreignKey: 'vendor_id'});
//Product Template has a foreign key product_category_id
ProductTemplate.belongsTo(ProductCategory, {foreignKey: 'product_category_id'});

User.hasMany(Order, {foreignKey: 'user_id'});
Order.belongsTo(User, {foreignKey: 'user_id'});
Order.belongsTo(Vendor, {foreignKey: 'vendor_id'});

ProductCategory.belongsTo(VendorType, {foreignKey: 'vendor_type_id'});

Vendor.hasMany(Notification, {foreignKey: 'vendor_id'});

sequelize.
//this is to drop and recreate tables
  // sync({force: true})
  //this is to update some parts of tables
  // sync({alter: true})
  //for normal uses
  sync()
  .then(result => {
    console.log('Database Connected');
  }).catch(err => {
    console.log(err);
  })

module.exports = app;
