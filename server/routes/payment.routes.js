const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, ctrl.create);
router.get('/my', authenticate, ctrl.getMyPayments);
router.put('/:id/refund', authenticate, requireAdmin, ctrl.refund);

module.exports = router;
