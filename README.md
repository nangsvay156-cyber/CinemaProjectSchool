# CinemaProjectSchool

A cinema management system for movies, showtimes, seat booking, and ticket sales. Created as a school project.

## Features

- Movie and showtime management
- Seat selection and ticket booking
- Customer management
- Ticket sales and payments
- Sales reports
- Admin and staff login

## Tech Stack

- Frontend: Client (npm)
- Backend: Server (Node.js, Express, MySQL)

## Project Structure

```
CinemaProjectSchool/
├── Server/      # Backend API (Node.js)
├── Client/      # Frontend application
└── README.md
```

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) v18 or newer
- [MySQL](https://www.mysql.com/)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nangsvay156-cyber/CinemaProjectSchool.git
   cd CinemaProjectSchool
   ```

2. Install dependencies:

   ```bash
   cd Server
   npm install
   cd ../Client
   npm install
   ```

3. Create the file `Server/.env`:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=cinema_db
   JWT_SECRET=change_this_to_a_long_random_text
   ```

   Never upload the `.env` file to GitHub.

4. Create the database. Open MySQL and run:

   ```sql
   CREATE DATABASE cinema_db;
   ```

## Running the Project

Open **two terminals**.

Terminal 1 (server):

```bash
cd Server
npm run dev
```

Terminal 2 (client):

```bash
cd Client
npm run dev
```

## License

MIT
