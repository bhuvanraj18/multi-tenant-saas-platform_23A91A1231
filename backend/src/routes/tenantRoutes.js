const express = require('express');
const router = express.Router();
const { getTenant, getAllTenants, updateTenantDetails } = require('../controllers/tenantController');
const { addUser, listUsers } = require('../controllers/userController'); // User routes nested under tenants for some Ops
const authMiddleware = require('../middleware/authMiddleware');

// Tenant Routes
router.get('/', authMiddleware, getAllTenants); // List all (Super Admin)
router.get('/:tenantId', authMiddleware, getTenant);
router.put('/:tenantId', authMiddleware, updateTenantDetails);

// Nested User Routes /api/tenants/:tenantId/users
router.post('/:tenantId/users', authMiddleware, addUser);
router.get('/:tenantId/users', authMiddleware, listUsers);

module.exports = router;
