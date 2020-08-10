const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Coupon = sequelize.define('coupon', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: { type: Sequelize.STRING, allowNull: false },
    description: Sequelize.TEXT,
    code: { type: Sequelize.STRING, allowNull: false },
    discount_percentage: { type: Sequelize.INTEGER, allowNull: false },
    max_discount: { type: Sequelize.FLOAT, allowNull: false },
    min_order: { type: Sequelize.FLOAT, allowNull: false },
    template_id: Sequelize.INTEGER,
    start_date: Sequelize.DATE,
    end_date: Sequelize.DATE,
    is_live: { type: Sequelize.BOOLEAN, defaultValue: true },
    applicable_to_all: { type: Sequelize.BOOLEAN, defaultValue: true },
    category_applicable: Sequelize.JSON,
    product_applicable: Sequelize.JSON,
    deleted: {type: Sequelize.BOOLEAN, defaultValue: false}
});

module.exports = Coupon;
