import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SeatSelection from './pages/SeatSelection';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';

import AdminLayout from './pages/Admin/AdminLayout';
import Dashboard from './pages/Admin/Dashboard';
import Movies from './pages/Admin/Movies';
import Rooms from './pages/Admin/Rooms';
import Showtimes from './pages/Admin/Showtimes';
import Promos from './pages/Admin/Promos';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies/:id" element={<MovieDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/booking/:showtimeId" element={<SeatSelection />} />
        <Route path="/checkout/:bookingId" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="movies" element={<Movies />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="showtimes" element={<Showtimes />} />
          <Route path="promos" element={<Promos />} />
        </Route>

        <Route path="*" element={<div className="container" style={{ paddingTop: 60 }}><h1>404</h1><p className="muted">Page not found.</p></div>} />
      </Routes>
    </>
  );
}
