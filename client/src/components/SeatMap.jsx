function seatColor(seat, isSelected) {
  if (seat.Availability === 'booked') return { bg: 'var(--surface-2)', border: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed' };
  if (isSelected) return { bg: 'var(--gold)', border: 'var(--gold)', color: '#26190a', cursor: 'pointer' };
  if (seat.SeatType === 'vip') return { bg: 'rgba(199,48,60,0.12)', border: 'var(--red)', color: 'var(--text)', cursor: 'pointer' };
  if (seat.SeatType === 'couple') return { bg: 'rgba(232,184,74,0.10)', border: 'var(--gold)', color: 'var(--text)', cursor: 'pointer' };
  return { bg: 'var(--surface-2)', border: 'var(--border)', color: 'var(--text)', cursor: 'pointer' };
}

export default function SeatMap({ seats, selected, onToggle }) {
  const rows = {};
  seats.forEach((s) => {
    const row = s.SeatNumber.match(/[A-Za-z]+/)[0];
    rows[row] = rows[row] || [];
    rows[row].push(s);
  });

  return (
    <div>
      <div style={{
        margin: '0 auto 32px', width: '80%', height: 8, borderRadius: '50%',
        background: 'linear-gradient(180deg, var(--gold), transparent)', boxShadow: '0 0 30px 4px rgba(232,184,74,0.35)'
      }} />
      <div style={{ textAlign: 'center', marginBottom: 28, fontSize: 12, letterSpacing: '0.15em', color: 'var(--text-muted)' }}>SCREEN</div>

      {Object.entries(rows).map(([row, rowSeats]) => (
        <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, justifyContent: 'center' }}>
          <span className="muted" style={{ width: 18, fontSize: 12 }}>{row}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {rowSeats.map((seat) => {
              const isSelected = selected.includes(seat.SeatId);
              const style = seatColor(seat, isSelected);
              return (
                <button
                  key={seat.SeatId}
                  disabled={seat.Availability === 'booked'}
                  onClick={() => onToggle(seat)}
                  title={`${seat.SeatNumber} · ${seat.SeatType}`}
                  style={{
                    width: 32, height: 30, borderRadius: 6, fontSize: 10.5, fontWeight: 600,
                    background: style.bg, border: `1.5px solid ${style.border}`, color: style.color, cursor: style.cursor
                  }}
                >
                  {seat.SeatNumber.replace(row, '')}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap', fontSize: 12.5 }}>
        <Legend color="var(--surface-2)" border="var(--border)" label="Normal" />
        <Legend color="rgba(199,48,60,0.12)" border="var(--red)" label="VIP" />
        <Legend color="rgba(232,184,74,0.10)" border="var(--gold)" label="Couple" />
        <Legend color="var(--gold)" border="var(--gold)" label="Selected" />
        <Legend color="var(--surface-2)" border="var(--border)" label="Booked" muted />
      </div>
    </div>
  );
}

function Legend({ color, border, label, muted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: muted ? 0.6 : 1 }}>
      <span style={{ width: 16, height: 16, borderRadius: 4, background: color, border: `1.5px solid ${border}` }} />
      <span className="muted">{label}</span>
    </div>
  );
}
