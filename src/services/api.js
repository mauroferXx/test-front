import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Productos
export const productAPI = {
  search: async (query, page = 1, pageSize = 20, country = null) => {
    const params = { query, page, pageSize };
    if (country && country !== 'all') {
      params.country = country;
    }
    const response = await api.get('/products/search', { params });
    return response.data;
  },

  getByBarcode: async (barcode, country = null) => {
    const params = {};
    if (country && country !== 'all') {
      params.country = country;
    }
    const response = await api.get(`/products/barcode/${barcode}`, { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Asegura que un producto exista en la BD y retorna el producto con ID
   * Útil cuando se agrega un producto desde la búsqueda
   */
  ensureExists: async (product) => {
    const response = await api.post('/products/cache', product);
    return response.data;
  }
};

// Listas
export const listAPI = {
  create: async (userId, name, budget) => {
    const response = await api.post('/lists', { userId, name, budget });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/lists/${id}`);
    return response.data;
  },

  addItem: async (listId, productId, quantity = 1) => {
    const response = await api.post(`/lists/${listId}/items`, {
      productId,
      quantity
    });
    return response.data;
  },

  optimize: async (listId, options = {}, country = null) => {
    const config = {};
    if (country && country !== 'all') {
      config.params = { country };
    }
    const response = await api.post(`/lists/${listId}/optimize`, { options }, config);
    return response.data;
  },

  getSubstitutes: async (productId, params = {}) => {
    const response = await api.get(`/lists/substitutes/${productId}`, { params });
    return response.data;
  }
};

// Compras
export const purchaseAPI = {
  create: async (userId, listId, items, totalPrice, totalCarbon, totalSavings) => {
    const response = await api.post('/purchases', {
      userId,
      listId,
      items,
      totalPrice,
      totalCarbon,
      totalSavings
    });
    return response.data;
  },

  getHistory: async (userId) => {
    const response = await api.get(`/purchases/user/${userId}`);
    return response.data;
  }
};

// Autenticación
export const authAPI = {
  register: async (email, name, password) => {
    const response = await api.post('/auth/register', { email, name, password });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  quickLoginTest: async () => {
    const response = await api.post('/auth/quick-login-test');
    return response.data;
  },

  getCurrentUser: async (userId) => {
    const response = await api.get('/auth/me', { params: { userId } });
    return response.data;
  }
};

// Carrito
export const cartAPI = {
  getCart: async (userId, country = null) => {
    const params = { userId };
    if (country && country !== 'all') {
      params.country = country;
    }
    const response = await api.get('/cart', { params });
    return response.data;
  },

  addItem: async (userId, productId, quantity = 1) => {
    const response = await api.post('/cart/add', { userId, productId, quantity });
    return response.data;
  },

  updateQuantity: async (userId, productId, quantity) => {
    const response = await api.put('/cart/update', { userId, productId, quantity });
    return response.data;
  },

  removeItem: async (userId, productId) => {
    const response = await api.delete('/cart/remove', { data: { userId, productId } });
    return response.data;
  },

  clear: async (userId) => {
    const response = await api.delete('/cart/clear', { data: { userId } });
    return response.data;
  }
};

export default api;

