const express = require('express');
const router = express.Router();
const { updateUserDetails, removeUser } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.put('/:userId', authMiddleware, updateUserDetails);
router.delete('/:userId', authMiddleware, removeUser);

module.exports = router;
