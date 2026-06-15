import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Admin({ apiUrl, user }) {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', countInStock: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get(`${apiUrl}/products`);
      setProducts(response.data);
    };
    fetchProducts();
  }, [apiUrl]);

  const token = localStorage.getItem('token');

  const handleCreate = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/products`,
        { ...newProduct, price: parseFloat(newProduct.price), countInStock: parseInt(newProduct.countInStock, 10) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) => [...prev, response.data]);
      setNewProduct({ name: '', description: '', price: '', countInStock: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create product');
    }
  };

  if (!user || user.role !== 'admin') return <p>Admin access required.</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="card">
        <h2>Create Product</h2>
        <div className="form-group">
          <label>Name</label>
          <input value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Price</label>
          <input value={newProduct.price} type="number" onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Stock</label>
          <input value={newProduct.countInStock} type="number" onChange={(e) => setNewProduct({ ...newProduct, countInStock: e.target.value })} />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="button" onClick={handleCreate}>Create Product</button>
      </div>
      <h2>Existing Products</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.countInStock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;
