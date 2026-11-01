const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/stats', authenticate, requireAdmin, ctrl.getStats);
router.get('/revenue', authenticate, requireAdmin, ctrl.getRevenueReport);

module.exports = router;
