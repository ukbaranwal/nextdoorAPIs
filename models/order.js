// product_details json
const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Order = sequelize.define('order', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  paid: {type: Sequelize.BOOLEAN, allowNull: false},
  amount: {type: Sequelize.FLOAT, allowNull: false},
  amount_paid_by_wallet: {type: Sequelize.FLOAT, defaultValue:0},
  amount_due: Sequelize.FLOAT,
  discount_applied: Sequelize.FLOAT,
  coupon_applied: {type:Sequelize.BOOLEAN, defaultValue: false},
  coupon_id: Sequelize.INTEGER,
  coupon_discount: Sequelize.FLOAT,
  payment_method: Sequelize.STRING,
  cashback: Sequelize.FLOAT,
  delivery_charge: {type: Sequelize.FLOAT, allowNull: false},
  units: {type: Sequelize.INTEGER, allowNull: false},
  transaction_id: Sequelize.STRING,
  delivery_tip: Sequelize.DOUBLE,
  instructions: Sequelize.TEXT,
  status: {type: Sequelize.STRING, allowNull: false},//pending,accepted,shipped,delivered
  cancelled: {type: Sequelize.BOOLEAN, defaultValue: false},
  review: Sequelize.TEXT,
  rating: Sequelize.FLOAT,
  product_review: Sequelize.JSON,
  delivery_review: Sequelize.TEXT,
  delivery_rating: Sequelize.FLOAT,
  address: {type: Sequelize.JSON, allowNull:false},
  packed_at: Sequelize.DATE,
  shipped_at: Sequelize.DATE,
  delivered_at: Sequelize.DATE,
  expected_delivery_at: Sequelize.DATE,
  products: {type: Sequelize.JSON, allowNull: false}//[{product_id:1, product_name:"Roadster Tshirt", product_brand:"Roadster", amount:999, discount_applied: 199, quantity:2, image:"a.jpg",}]
});

module.exports = Order;
