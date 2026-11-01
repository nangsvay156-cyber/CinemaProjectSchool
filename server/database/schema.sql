-- ==========================================================
-- Cinema Booking System - MySQL Schema
-- ==========================================================
CREATE DATABASE IF NOT EXISTS cinema_booking CHARACTER SET utf8mb4;
USE cinema_booking;

-- ----------------------------------------------------------
-- Users (customers + admins)
-- ----------------------------------------------------------
CREATE TABLE users (
  UserId        INT AUTO_INCREMENT PRIMARY KEY,
  FullName      VARCHAR(100) NOT NULL,
  Email         VARCHAR(150) NOT NULL UNIQUE,
  Password      VARCHAR(255) NOT NULL,
  Phone         VARCHAR(20),
  Role          ENUM('customer','admin') DEFAULT 'customer',
  Status        ENUM('active','banned') DEFAULT 'active',
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- Movies
-- ----------------------------------------------------------
CREATE TABLE movies (
  MovieId       INT AUTO_INCREMENT PRIMARY KEY,
  Title         VARCHAR(200) NOT NULL,
  Description   TEXT,
  Category      VARCHAR(50),          -- Action, Horror, Comedy...
  Duration      INT,                  -- minutes
  Language      VARCHAR(50),
  ReleaseDate   DATE,
  Poster        VARCHAR(255),
  Trailer       VARCHAR(255),
  Rating        DECIMAL(2,1) DEFAULT 0,   -- avg rating, derived from reviews
  Status        ENUM('now_showing','coming_soon','ended') DEFAULT 'now_showing',
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- Cinema Rooms
-- ----------------------------------------------------------
CREATE TABLE cinema_rooms (
  RoomId        INT AUTO_INCREMENT PRIMARY KEY,
  RoomName      VARCHAR(50) NOT NULL,
  Type          ENUM('2D','3D','IMAX') DEFAULT '2D',
  Capacity      INT NOT NULL,
  Status        ENUM('active','inactive') DEFAULT 'active'
);

-- ----------------------------------------------------------
-- Seats (static layout per room)
-- ----------------------------------------------------------
CREATE TABLE seats (
  SeatId        INT AUTO_INCREMENT PRIMARY KEY,
  RoomId        INT NOT NULL,
  SeatNumber    VARCHAR(10) NOT NULL,   -- e.g. A1, B12
  SeatType      ENUM('normal','vip','couple') DEFAULT 'normal',
  Price         DECIMAL(10,2) NOT NULL DEFAULT 0,   -- base price surcharge for the seat type
  Status        ENUM('active','inactive') DEFAULT 'active',
  FOREIGN KEY (RoomId) REFERENCES cinema_rooms(RoomId) ON DELETE CASCADE,
  UNIQUE KEY uniq_room_seat (RoomId, SeatNumber)
);

-- ----------------------------------------------------------
-- Showtimes
-- ----------------------------------------------------------
CREATE TABLE showtimes (
  ShowtimeId    INT AUTO_INCREMENT PRIMARY KEY,
  MovieId       INT NOT NULL,
  RoomId        INT NOT NULL,
  Date          DATE NOT NULL,
  StartTime     TIME NOT NULL,
  EndTime       TIME NOT NULL,
  Price         DECIMAL(10,2) NOT NULL,   -- base ticket price for this showtime
  Status        ENUM('scheduled','cancelled','completed') DEFAULT 'scheduled',
  FOREIGN KEY (MovieId) REFERENCES movies(MovieId) ON DELETE CASCADE,
  FOREIGN KEY (RoomId) REFERENCES cinema_rooms(RoomId) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- Bookings
-- ----------------------------------------------------------
CREATE TABLE bookings (
  BookingId     INT AUTO_INCREMENT PRIMARY KEY,
  CustomerId    INT NOT NULL,
  ShowtimeId    INT NOT NULL,
  BookingDate   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  TotalPrice    DECIMAL(10,2) NOT NULL,
  PromoCode     VARCHAR(30),
  Status        ENUM('pending','confirmed','cancelled','expired') DEFAULT 'pending',
  FOREIGN KEY (CustomerId) REFERENCES users(UserId) ON DELETE CASCADE,
  FOREIGN KEY (ShowtimeId) REFERENCES showtimes(ShowtimeId) ON DELETE CASCADE
);

-- Junction table: which seats belong to which booking (seat availability is
-- per-showtime, so we never mutate the static `seats` table for bookings)
CREATE TABLE booking_seats (
  BookingSeatId INT AUTO_INCREMENT PRIMARY KEY,
  BookingId     INT NOT NULL,
  SeatId        INT NOT NULL,
  ShowtimeId    INT NOT NULL,
  Price         DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (BookingId) REFERENCES bookings(BookingId) ON DELETE CASCADE,
  FOREIGN KEY (SeatId) REFERENCES seats(SeatId) ON DELETE CASCADE,
  UNIQUE KEY uniq_showtime_seat (ShowtimeId, SeatId) -- prevents double booking
);

-- ----------------------------------------------------------
-- Payments
-- ----------------------------------------------------------
CREATE TABLE payments (
  PaymentId     INT AUTO_INCREMENT PRIMARY KEY,
  BookingId     INT NOT NULL,
  Method        ENUM('cash','aba_pay','acleda','visa','mastercard','qr') NOT NULL,
  Amount        DECIMAL(10,2) NOT NULL,
  PaymentDate   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Status        ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  TransactionId VARCHAR(100),
  FOREIGN KEY (BookingId) REFERENCES bookings(BookingId) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- Tickets (QR)
-- ----------------------------------------------------------
CREATE TABLE tickets (
  TicketId      INT AUTO_INCREMENT PRIMARY KEY,
  BookingId     INT NOT NULL,
  TicketCode    VARCHAR(64) NOT NULL UNIQUE,  -- encoded into the QR
  IsUsed        BOOLEAN DEFAULT FALSE,
  UsedAt        TIMESTAMP NULL,
  FOREIGN KEY (BookingId) REFERENCES bookings(BookingId) ON DELETE CASCADE
);

-- ----------------------------------------------------------
-- Extra features
-- ----------------------------------------------------------
CREATE TABLE reviews (
  ReviewId      INT AUTO_INCREMENT PRIMARY KEY,
  MovieId       INT NOT NULL,
  UserId        INT NOT NULL,
  Rating        TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
  Comment       TEXT,
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (MovieId) REFERENCES movies(MovieId) ON DELETE CASCADE,
  FOREIGN KEY (UserId) REFERENCES users(UserId) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_movie_review (MovieId, UserId)
);

CREATE TABLE favorites (
  UserId        INT NOT NULL,
  MovieId       INT NOT NULL,
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (UserId, MovieId),
  FOREIGN KEY (UserId) REFERENCES users(UserId) ON DELETE CASCADE,
  FOREIGN KEY (MovieId) REFERENCES movies(MovieId) ON DELETE CASCADE
);

CREATE TABLE promo_codes (
  PromoId       INT AUTO_INCREMENT PRIMARY KEY,
  Code          VARCHAR(30) NOT NULL UNIQUE,
  DiscountType  ENUM('percent','fixed') DEFAULT 'percent',
  DiscountValue DECIMAL(10,2) NOT NULL,
  ExpiryDate    DATE,
  MaxUses       INT DEFAULT 0,       -- 0 = unlimited
  UsedCount     INT DEFAULT 0,
  Status        ENUM('active','inactive') DEFAULT 'active'
);

-- ----------------------------------------------------------
-- Seed: default admin (password = Admin@123, bcrypt hashed below)
-- Replace hash via the /api/auth/register flow if you prefer.
-- ----------------------------------------------------------
-- INSERT INTO users (FullName, Email, Password, Role) VALUES
-- ('System Admin', 'admin@cinema.com', '$2a$10$replace_with_bcrypt_hash', 'admin');
