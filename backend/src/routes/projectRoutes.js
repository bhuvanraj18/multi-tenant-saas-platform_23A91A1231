const express = require('express');
const router = express.Router();
const {
    createNewProject,
    listProjects,
    singleProject,
    updateProjectDetails,
    removeProject
} = require('../controllers/projectController');
const { addTask, listTasks } = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createNewProject);
router.get('/', listProjects);
router.get('/:projectId', singleProject);
router.put('/:projectId', updateProjectDetails);
router.delete('/:projectId', removeProject);

// Nested Task Routes: /api/projects/:projectId/tasks
router.post('/:projectId/tasks', addTask);
router.get('/:projectId/tasks', listTasks);

module.exports = router;
