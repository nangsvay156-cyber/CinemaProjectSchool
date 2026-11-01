// Run with: npm run seed
// Creates a default admin login and some sample data so you can explore the app immediately.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await db.query(
    `INSERT INTO users (FullName, Email, Password, Role) VALUES (?, ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE FullName = VALUES(FullName)`,
    ['System Admin', 'admin@cinema.com', adminPassword]
  );
  console.log('✔ Admin created -> admin@cinema.com / Admin@123');

  const [roomResult] = await db.query(
    `INSERT INTO cinema_rooms (RoomName, Type, Capacity) VALUES ('Room 1', 'IMAX', 80)`
  );
  const roomId = roomResult.insertId;

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seatValues = [];
  for (const row of rows) {
    for (let i = 1; i <= 10; i++) {
      const type = row === 'A' ? 'vip' : row === 'E' ? 'couple' : 'normal';
      const price = type === 'vip' ? 8 : type === 'couple' ? 14 : 5;
      seatValues.push([roomId, `${row}${i}`, type, price]);
    }
  }
  await db.query('INSERT INTO seats (RoomId, SeatNumber, SeatType, Price) VALUES ?', [seatValues]);
  console.log(`✔ Room "Room 1" created with ${seatValues.length} seats`);

  const [movieResult] = await db.query(
    `INSERT INTO movies (Title, Description, Category, Duration, Language, ReleaseDate, Status)
     VALUES ('Sample Action Movie', 'A thrilling demo movie for testing the booking flow.', 'Action', 120, 'English', CURDATE(), 'now_showing')`
  );
  console.log('✔ Sample movie created:', movieResult.insertId);

  await db.query(
    `INSERT INTO showtimes (MovieId, RoomId, Date, StartTime, EndTime, Price)
     VALUES (?, ?, CURDATE(), '18:00:00', '20:00:00', 6.00)`,
    [movieResult.insertId, roomId]
  );
  console.log('✔ Sample showtime created for today at 18:00');

  console.log('Done. You can now log in as admin or register a customer account.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
