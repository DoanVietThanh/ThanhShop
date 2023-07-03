const jwt = require('jsonwebtoken');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../middleware/jwt');
const User = require('../models/user');
const asyncHandler = require('express-async-handler');

// Function: Register
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

// Function: Login
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
    // => Hidden password, role
    const { password, role, ...userData } = user.toObject();
    // Tạo accessToken và refreshToken
    const accessToken = generateAccessToken(user._id, role);
    const refreshToken = generateRefreshToken(user._id);
    // Lưu Refresh token vào database
    await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
    // Lưu refreshToken vào Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.status(200).json({
      success: true,
      message: 'Login Successfully',
      accessToken,
      userData: userData,
    });
  } else {
    throw new Error('Invalid Credentials');
  }
});

// Function: Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id).select('-refreshToken -password -role');
  return res.status(200).json({
    success: true,
    result: user ? user : 'User not found',
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // Lấy token từ cookies
  const cookie = req.cookies;
  // Check xem có token hay không
  if (!cookie && !cookie.refreshToken)
    throw new Error('No refresh token in cookies');
  // Check token có hợp lệ hay không
  const rs = await jwt.verify(cookie.refreshToken, process.env.JWT_SECRET);
  const response = await User.findOne({
    _id: rs._id,
    refreshToken: cookie.refreshToken,
  });
  return res.status(200).json({
    success: response ? true : false,
    newAccessToken: response
      ? generateAccessToken(response._id, response.role)
      : 'Refresh token not matched',
  });
});

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie || !cookie.refreshToken)
    throw new Error('No refresh token in cookies');
  // Xóa refresh token ở db
  await User.findOneAndUpdate(
    { refreshToken: cookie.refreshToken },
    { refreshToken: '' },
    { new: true }
  );
  // Xóa refresh token ở cookie trình duyệt
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
  });
  return res.status(200).json({
    success: true,
    mes: 'Logout is done',
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshAccessToken,
  logout,
};
