const Vendor = require('../models/vendor');
module.exports = (req, res, next) => {
  Vendor.findOne({where: {id: req.id}})
  .then(vendor =>{
      if(!vendor.verified){
        const error = new Error('Vendor needs to be verified first');
        error.statusCode = 403;
        throw error;
      }
      if(!vendor.membership_active){
        const error = new Error('Vendor needs to pay his dues to continue using our service');
        error.statusCode = 402;
        throw error;
      }
      if(vendor.ban){
        const error = new Error('Vendor has been banned from our server, talk to our customer care for more detail');
        error.statusCode = 403;
        throw error;
      }
      req.vendor = vendor;
      next();
  })
  .catch(err => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err);
    })
};
