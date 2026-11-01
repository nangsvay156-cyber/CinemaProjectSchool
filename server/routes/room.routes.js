const router = require('express').Router();
const roomCtrl = require('../controllers/room.controller');
const seatCtrl = require('../controllers/seat.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', roomCtrl.getAll);
router.get('/:id', roomCtrl.getById);
router.post('/', authenticate, requireAdmin, roomCtrl.create);
router.put('/:id', authenticate, requireAdmin, roomCtrl.update);
router.delete('/:id', authenticate, requireAdmin, roomCtrl.remove);

// Seats nested under a room
router.get('/:roomId/seats', seatCtrl.getByRoom);
router.post('/:roomId/seats/layout', authenticate, requireAdmin, seatCtrl.generateLayout);

module.exports = router;
