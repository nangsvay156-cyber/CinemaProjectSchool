const router = require('express').Router();
const ctrl = require('../controllers/showtime.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/seats', ctrl.getSeatMap);
router.post('/', authenticate, requireAdmin, ctrl.create);
router.put('/:id', authenticate, requireAdmin, ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

module.exports = router;
