import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Orders({ apiUrl, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return setLoading(false);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
      setLoading(false);
    };
    fetchOrders();
  }, [apiUrl, user]);

  if (!user) return <p>Please log in to view orders.</p>;

  return (
    <div>
      <h1>Orders</h1>
      {loading ? <p>Loading...</p> : (
        orders.length === 0 ? <p>No orders yet.</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>{order.status}</td>
                  <td>{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

export default Orders;
