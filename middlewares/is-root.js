const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  console.log(authHeader);
  const token = authHeader;
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'somesupersecretsecretadmin');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authenticated.');
    error.statusCode = 401;
    throw error;
  }
  if(!decodedToken.root_access){
    const error = new Error('Root access needed.');
    error.statusCode = 403;
    throw error;
  }
  req.id = decodedToken.id;
  next();
};
