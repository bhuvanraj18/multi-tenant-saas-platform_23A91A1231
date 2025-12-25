const express = require('express');
const router = express.Router();
const { updateTaskDetails, updateTaskStatus, removeTask } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.put('/:taskId', updateTaskDetails);
router.patch('/:taskId/status', updateTaskStatus);
router.delete('/:taskId', removeTask);

module.exports = router;
