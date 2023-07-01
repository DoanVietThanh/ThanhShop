const User = require('../models/user');
const asyncHandler = require('express-async-handler');

const register = asyncHandler(async (req, res) => {
  const { email, password, firstname, lastname } = req.body;
  console.log(email, password, firstname, lastname);
  if (!email || !password || !firstname || !lastname) {
    return res.status(400).json({
      success: false,
      mes: 'Register misses inputs',
    });
  }
  // Check User isExisted
  const user = await User.findOne({ email });
  if (user) {
    throw new Error('User is existed');
  } else {
    const newUser = await User.create(req.body);
    return res.status(200).json({
      success: newUser ? true : false,
      message: newUser ? 'Register successfully !' : 'Something went wrong',
      newUser,
    });
  }
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Login misses inputs',
    });
  }
  const user = await User.findOne({ email });
  if (user && (await user.isCorrectPssword(password))) {
    const { password, role, ...userData } = user.toObject();
    return res.status(200).json({
      success: true,
      message: 'Login Successfully',
      userData: userData,
    });
  } else {
    throw new Error('Invalid Credentials');
  }
});

module.exports = { register, login };
