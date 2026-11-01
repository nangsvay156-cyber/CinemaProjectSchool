const router = require('express').Router();
const ctrl = require('../controllers/movie.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../utils/upload');

router.get('/favorites/mine', authenticate, ctrl.getMyFavorites);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, requireAdmin, upload.single('poster'), ctrl.create);
router.put('/:id', authenticate, requireAdmin, upload.single('poster'), ctrl.update);
router.delete('/:id', authenticate, requireAdmin, ctrl.remove);

router.post('/:id/reviews', authenticate, ctrl.addReview);
router.post('/:id/favorite', authenticate, ctrl.toggleFavorite);

module.exports = router;
