const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const verifyAccessToken = asyncHandler(async (req, res, next) => {
  if (req?.headers?.authorization?.startsWith('Bearer')) {
    // headers: { authorization: Bearer ${token}}
    const accessToken = req.headers.authorization.split(' ')[1];
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, decode) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid access token',
        });
      }
      console.log('decode: ', decode);
      req.user = decode;
      next();
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Require authenciation !!!',
    });
  }
});

const isAdmin = asyncHandler((req, res, next) => {
  const { role } = req.user;
  if (role != 'admin') {
    return res.status(401).json({
      succeed: false,
      message: 'Require admin role',
    });
  }
  next();
});

module.exports = { verifyAccessToken, isAdmin };
