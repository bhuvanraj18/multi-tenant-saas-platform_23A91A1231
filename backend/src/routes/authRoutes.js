const express = require('express');
const router = express.Router();
const { registerTenant, login, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register-tenant', registerTenant);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

module.exports = router;
