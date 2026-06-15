import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Home from './pages/Home';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Admin from './pages/Admin';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const profile = localStorage.getItem('user');
    if (token && profile) {
      setUser(JSON.parse(profile));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header>
        <Link to="/">Store</Link>
        <nav>
          <Link to="/">Products</Link>
          <Link to="/cart">Cart ({cart.reduce((sum, item) => sum + item.qty, 0)})</Link>
          <Link to="/orders">Orders</Link>
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home apiUrl={API_URL} addToCart={(product) => {
            setCart((current) => {
              const existing = current.find((item) => item.product === product._id);
              if (existing) {
                return current.map((item) => item.product === product._id ? { ...item, qty: item.qty + 1 } : item);
              }
              return [...current, { product: product._id, name: product.name, price: product.price, qty: 1 }];
            });
          }} />} />
          <Route path="/login" element={<Login apiUrl={API_URL} setUser={setUser} />} />
          <Route path="/cart" element={<Cart apiUrl={API_URL} user={user} cart={cart} setCart={setCart} />} />
          <Route path="/orders" element={<Orders apiUrl={API_URL} user={user} />} />
          <Route path="/admin" element={<Admin apiUrl={API_URL} user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
