const router = require('express').Router();
const ctrl = require('../controllers/ticket.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/:bookingId/qr', authenticate, ctrl.getQr);
router.get('/:bookingId/pdf', authenticate, ctrl.downloadPdf);
router.post('/verify', authenticate, requireAdmin, ctrl.verify);

module.exports = router;
