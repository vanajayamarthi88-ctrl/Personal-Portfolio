import React, { useState } from 'react';
import axios from 'axios';

function Cart({ apiUrl, user, cart, setCart }) {
  const [message, setMessage] = useState(null);

  const updateQty = (productId, qty) => {
    setCart(cart.map((item) => item.product === productId ? { ...item, qty } : item));
  };

  const placeOrder = async () => {
    if (!user) return setMessage('Please log in to place an order.');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${apiUrl}/orders`,
        { items: cart.map((item) => ({ product: item.product, qty: item.qty })) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      setMessage('Order submitted successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Order failed');
    }
  };

  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div>
      <h1>Cart</h1>
      {cart.length === 0 ? <p>The cart is empty.</p> : (
        <div>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.product}>
                  <td>{item.name}</td>
                  <td>
                    <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.product, parseInt(e.target.value, 10))} />
                  </td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>${(item.qty * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p><strong>Total: ${total.toFixed(2)}</strong></p>
          <button onClick={placeOrder}>Place Order</button>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default Cart;
