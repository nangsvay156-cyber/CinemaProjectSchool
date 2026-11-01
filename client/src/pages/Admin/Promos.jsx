import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function Promos() {
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState({ code: '', discountType: 'percent', discountValue: 10, expiryDate: '', maxUses: 0 });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/promocodes');
    setPromos(data);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/promocodes', form);
      setForm({ code: '', discountType: 'percent', discountValue: 10, expiryDate: '', maxUses: 0 });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create promo code.');
    }
  }

  async function remove(id) {
    await api.delete(`/promocodes/${id}`);
    load();
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 28 }}>
      <form onSubmit={submit} className="card" style={{ alignSelf: 'start' }}>
        <h3 style={{ marginBottom: 16 }}>Add Promo Code</h3>
        <div className="field">
          <label>Code</label>
          <input className="input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </div>
        <div className="field">
          <label>Discount type</label>
          <select className="input" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed amount ($)</option>
          </select>
        </div>
        <div className="field">
          <label>Discount value</label>
          <input className="input" type="number" required value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
        </div>
        <div className="field">
          <label>Expiry date (optional)</label>
          <input className="input" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
        </div>
        <div className="field">
          <label>Max uses (0 = unlimited)</label>
          <input className="input" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-primary btn-full">Create Promo</button>
      </form>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', alignContent: 'start' }}>
        {promos.map((p) => (
          <div key={p.PromoId} className="card">
            <h4 style={{ color: 'var(--gold)' }}>{p.Code}</h4>
            <p className="muted" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>
              {p.DiscountType === 'percent' ? `${p.DiscountValue}% off` : `$${p.DiscountValue} off`} · used {p.UsedCount}/{p.MaxUses || '∞'}
            </p>
            <button className="btn btn-ghost" onClick={() => remove(p.PromoId)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
