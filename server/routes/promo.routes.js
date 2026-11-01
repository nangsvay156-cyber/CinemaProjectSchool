const router = require('express').Router();
const db = require('../config/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const [rows] = await db.query('SELECT * FROM promo_codes ORDER BY PromoId DESC');
  res.json(rows);
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, maxUses } = req.body;
    if (!code || !discountValue) return res.status(400).json({ message: 'Code and discount value are required.' });
    await db.query(
      'INSERT INTO promo_codes (Code, DiscountType, DiscountValue, ExpiryDate, MaxUses) VALUES (?, ?, ?, ?, ?)',
      [code.toUpperCase(), discountType || 'percent', discountValue, expiryDate || null, maxUses || 0]
    );
    res.status(201).json({ message: 'Promo code created.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That promo code already exists.' });
    res.status(500).json({ message: 'Could not create the promo code.' });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { discountType, discountValue, expiryDate, maxUses, status } = req.body;
  await db.query(
    'UPDATE promo_codes SET DiscountType=?, DiscountValue=?, ExpiryDate=?, MaxUses=?, Status=? WHERE PromoId=?',
    [discountType, discountValue, expiryDate, maxUses, status, req.params.id]
  );
  res.json({ message: 'Promo code updated.' });
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  await db.query('DELETE FROM promo_codes WHERE PromoId = ?', [req.params.id]);
  res.json({ message: 'Promo code deleted.' });
});

module.exports = router;
