const {
  generateAccessToken,
  generateRefreshToken,
} = require('../middleware/jwt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const sendMail = require('../utils/sendMail');
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');

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
  if (user && (await user.isCorrectPassword(password))) {
    // => Hidden password, role
    const { password, role, refreshToken, ...userData } = user.toObject();
    // Tạo accessToken và refreshToken
    const accessToken = generateAccessToken(user._id, role);
    const newRefreshToken = generateRefreshToken(user._id);
    // Lưu Refresh token vào database
    await User.findByIdAndUpdate(
      user._id,
      { refreshToken: newRefreshToken },
      { new: true }
    );
    // Lưu refreshToken vào Cookie
    res.cookie('refreshToken', newRefreshToken, {
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
    success: user ? true : false,
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

const forgotPassword = asyncHandler(async (req, res) => {
  // Clients gửi mail
  // Server check mail email có hợp lệ hay ko -> Gửi mail + kèm theo link (password change token)
  // Client check mail -> click link
  // Client gửi api kèm token
  // Check token có giống token mà server gửi mail hay không
  // Change password
  const { email } = req.query;
  if (!email) throw new Error('Missing email');
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');
  const resetToken = user.createPasswordChangedToken();
  await user.save();
  const html =
    `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn.` +
    `Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href="${process.env.URL_SERVER}/api/user/reset-password/${resetToken}">Click here</a>`;
  const data = { email, html };
  const rs = await sendMail(data);
  return res.status(200).json({
    success: true,
    rs,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password, token } = req.body;
  if (!password || !token) throw new Error('Missing imputs password or token');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error('Invalid reset token');
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  user.passwordResetExpires = undefined;
  await user.save();
  return res.status(200).json({
    success: user ? true : false,
    mes: user ? 'Updated password' : 'Something went wrong',
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const user = await User.find().select('-refreshToken -password');
  return res.status(200).json({
    success: user ? true : false,
    users: user,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.query;
  if (!_id) {
    throw new Error('Missing input. Delete Failed');
  }
  const rs = await User.findByIdAndDelete(_id);
  return res.status(200).json({
    success: rs ? true : false,
    message: 'Delete successfully',
    deletedUser: rs
      ? `User has email ${rs.email} being deleted`
      : 'No user delete',
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id || Object.keys(req.body).length === 0) {
    throw new Error('Missing inputs');
  }
  const response = await User.findByIdAndUpdate(_id, req.body, {
    new: true,
  }).select('-password -role -refreshToken');
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : 'Some thing went wrong',
  });
});

const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { uid } = req.params;
  if (Object.keys(req.body).length === 0) throw new Error('Missing inputs');
  const response = await User.findByIdAndUpdate(uid, req.body, {
    new: true,
  }).select('-password -role -refreshToken');
  return res.status(200).json({
    success: response ? true : false,
    updatedUser: response ? response : 'Some thing went wrong',
  });
});

module.exports = {
  register,
  login,
  getCurrentUser,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getUsers,
  deleteUser,
  updateUser,
  updateUserByAdmin,
};
