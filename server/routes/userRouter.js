const router = require('express').Router();
const userControl = require('../controllers/userControl');
const { verifyAccessToken } = require('../middleware/verifyToken');

router.post('/register', userControl.register);
router.post('/login', userControl.login);
router.get('/current', verifyAccessToken, userControl.getCurrentUser);
router.get('/refreshToken', userControl.refreshAccessToken);
router.get('/logout', userControl.logout);

module.exports = router;
