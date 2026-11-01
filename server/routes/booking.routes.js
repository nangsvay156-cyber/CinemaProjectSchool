const router = require('express').Router();
const ctrl = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ctrl.create);
router.get('/my', authenticate, ctrl.getMyBookings);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id/cancel', authenticate, ctrl.cancel);

module.exports = router;
