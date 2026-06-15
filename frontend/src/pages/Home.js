import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Home({ apiUrl, addToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get(`${apiUrl}/products`);
      setProducts(response.data);
      setLoading(false);
    };
    fetchProducts();
  }, [apiUrl]);

  return (
    <div>
      <h1>Product Catalog</h1>
      {loading ? <p>Loading products...</p> : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product._id} className="card">
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <p><strong>${product.price.toFixed(2)}</strong></p>
              <button onClick={() => addToCart(product)}>Add to cart</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
