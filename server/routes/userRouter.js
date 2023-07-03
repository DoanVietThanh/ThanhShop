const router = require('express').Router();
const userControl = require('../controllers/userControl');
const { verifyAccessToken, isAdmin } = require('../middleware/verifyToken');

router.post('/register', userControl.register);
router.post('/login', userControl.login);
router.get('/current', verifyAccessToken, userControl.getCurrentUser);
router.get('/refreshToken', userControl.refreshAccessToken);
router.get('/logout', userControl.logout);
router.get('/forgot-password', userControl.forgotPassword);
router.put('/reset-password', userControl.resetPassword);
router.get('/', [verifyAccessToken, isAdmin], userControl.getUsers);
router.delete('/', [verifyAccessToken, isAdmin], userControl.deleteUser);
router.put('/current', [verifyAccessToken], userControl.updateUser);
router.put(
  '/:uid',
  [verifyAccessToken, isAdmin],
  userControl.updateUserByAdmin
);

module.exports = router;
