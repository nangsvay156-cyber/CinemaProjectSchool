const router = require('express').Router();
const ctrl = require('../controllers/seat.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.put('/:seatId', authenticate, requireAdmin, ctrl.updateSeat);
router.delete('/:seatId', authenticate, requireAdmin, ctrl.deleteSeat);

module.exports = router;
