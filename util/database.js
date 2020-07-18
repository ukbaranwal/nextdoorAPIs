const Sequelize = require('sequelize');

const sequelize = new Sequelize('nextdoor', 'postgres', 'postgres', {
  dialect: 'postgres',
  host: 'localhost',
});

module.exports = sequelize;
