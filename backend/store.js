const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'data.json');
const defaultData = {
  users: [],
  products: [],
  orders: [],
};

const readDB = async () => {
  try {
    const json = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(json);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeDB(defaultData);
      return { ...defaultData };
    }
    throw error;
  }
};

const writeDB = async (data) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

const createId = () => crypto.randomUUID();

const getUsers = async () => {
  const db = await readDB();
  return db.users;
};

const getProducts = async () => {
  const db = await readDB();
  return db.products;
};

const getOrders = async () => {
  const db = await readDB();
  return db.orders;
};

const findUserByEmail = async (email) => {
  const users = await getUsers();
  return users.find((user) => user.email === email);
};

const findUserById = async (id) => {
  const users = await getUsers();
  return users.find((user) => user._id === id);
};

const addUser = async (user) => {
  const db = await readDB();
  const newUser = { ...user, _id: createId(), createdAt: new Date().toISOString() };
  db.users.push(newUser);
  await writeDB(db);
  return newUser;
};

const addProduct = async (product) => {
  const db = await readDB();
  const newProduct = { ...product, _id: createId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.products.push(newProduct);
  await writeDB(db);
  return newProduct;
};

const updateProduct = async (id, updates) => {
  const db = await readDB();
  const product = db.products.find((item) => item._id === id);
  if (!product) return null;
  Object.assign(product, updates, { updatedAt: new Date().toISOString() });
  await writeDB(db);
  return product;
};

const deleteProduct = async (id) => {
  const db = await readDB();
  const index = db.products.findIndex((item) => item._id === id);
  if (index < 0) return false;
  db.products.splice(index, 1);
  await writeDB(db);
  return true;
};

const findProductById = async (id) => {
  const products = await getProducts();
  return products.find((product) => product._id === id);
};

const addOrder = async (order) => {
  const db = await readDB();
  const newOrder = { ...order, _id: createId(), status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  db.orders.push(newOrder);
  await writeDB(db);
  return newOrder;
};

const updateOrderStatus = async (id, status) => {
  const db = await readDB();
  const order = db.orders.find((item) => item._id === id);
  if (!order) return null;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  await writeDB(db);
  return order;
};

const initializeData = async (seed) => {
  const db = await readDB();
  let changed = false;

  if (!db.users.some((user) => user.role === 'admin')) {
    db.users.push({
      _id: createId(),
      name: 'Admin User',
      email: 'admin@store.com',
      password: seed.adminPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    changed = true;
  }

  if (!db.products.length) {
    db.products.push(
      { _id: createId(), name: 'Classic Tee', description: 'Comfortable cotton t-shirt', price: 19.99, image: '', countInStock: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { _id: createId(), name: 'Running Shoes', description: 'Lightweight running sneakers', price: 69.99, image: '', countInStock: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { _id: createId(), name: 'Wireless Headphones', description: 'Noise-cancelling over-ear headphones', price: 129.99, image: '', countInStock: 8, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    );
    changed = true;
  }

  if (changed) {
    await writeDB(db);
  }
};

module.exports = {
  findUserByEmail,
  findUserById,
  addUser,
  getProducts,
  findProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getOrders,
  addOrder,
  updateOrderStatus,
  initializeData,
};
