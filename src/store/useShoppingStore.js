import { create } from 'zustand';

const useShoppingStore = create((set, get) => ({
  // Usuario autenticado
  user: null,
  isAuthenticated: false,

  // Lista de compras actual
  wishlist: [],

  // Lista optimizada
  optimizedList: null,

  // Productos seleccionados para comparar
  productsToCompare: [],

  // Estado de carga
  loading: false,

  // Errores
  error: null,

  // País seleccionado (global para toda la app)
  selectedCountry: (() => {
    // Cargar país del localStorage al inicializar
    try {
      const stored = localStorage.getItem('selectedCountry');
      return stored || 'en:chile'; // Chile por defecto
    } catch {
      return 'en:chile'; // Chile por defecto
    }
  })(),

  // Autenticación
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    // Guardar en localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, wishlist: [] });
    localStorage.removeItem('user');
  },

  // Actualizar preferencias de usuario
  updatePreferences: async (preferences) => {
    const user = get().user;
    if (!user) return;

    // Actualizar estado local
    const updatedUser = { ...user, preferences: { ...user.preferences, ...preferences } };
    set({ user: updatedUser });
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Sincronizar con BD
    try {
      const { authAPI } = await import('../services/api.js');
      // Nota: Necesitamos agregar el método updatePreferences a authAPI o crear userAPI
      // Por ahora usaremos fetch directo o agregaremos a api.js después
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) throw new Error('Failed to update preferences');
    } catch (error) {
      console.error('Error updating preferences:', error);
      // Revertir en caso de error si fuera necesario
    }
  },

  // Cargar usuario del localStorage al iniciar
  loadUserFromStorage: () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        // Validar que el usuario tenga los campos necesarios
        if (user && user.id) {
          // Asegurar que preferences exista
          if (!user.preferences) user.preferences = {};
          set({ user, isAuthenticated: true });
        } else {
          // Si el usuario no es válido, limpiar
          localStorage.removeItem('user');
          set({ user: null, isAuthenticated: false });
        }
      } else {
        // Si no hay usuario guardado, asegurarse de que el estado esté limpio
        set({ user: null, isAuthenticated: false });
      }
    } catch (e) {
      console.error('Error loading user from localStorage:', e);
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false });
    }
  },

  // Cargar carrito desde BD
  loadCartFromDB: async (userId, country = null) => {
    try {
      const { cartAPI } = await import('../services/api.js');
      const response = await cartAPI.getCart(userId, country);
      if (response.items && response.items.length > 0) {
        const cartItems = response.items.map(item => ({
          ...item.product,
          quantity: item.quantity,
          id: item.product_id
        }));
        set({ wishlist: cartItems });
      }
    } catch (error) {
      console.error('Error loading cart from DB:', error);
    }
  },

  // Sincronizar carrito con BD
  syncCartToDB: async (userId) => {
    try {
      const { cartAPI } = await import('../services/api.js');
      const wishlist = get().wishlist;

      // Limpiar carrito en BD primero
      await cartAPI.clear(userId);

      // Agregar todos los items del carrito a BD
      for (const product of wishlist) {
        if (product.id) {
          await cartAPI.addItem(userId, product.id, product.quantity || 1);
        }
      }
    } catch (error) {
      console.error('Error syncing cart to DB:', error);
    }
  },

  // Establecer país seleccionado
  setSelectedCountry: (country) => {
    set({ selectedCountry: country });
    // Guardar en localStorage
    try {
      localStorage.setItem('selectedCountry', country);
    } catch (e) {
      console.error('Error saving country to localStorage:', e);
    }
  },

  // Cargar país del localStorage
  loadCountryFromStorage: () => {
    try {
      const stored = localStorage.getItem('selectedCountry');
      if (stored) {
        set({ selectedCountry: stored });
      } else {
        // Si no hay país guardado, establecer Chile como predeterminado
        set({ selectedCountry: 'en:chile' });
        localStorage.setItem('selectedCountry', 'en:chile');
      }
    } catch (e) {
      console.error('Error loading country from localStorage:', e);
      // En caso de error, establecer Chile como predeterminado
      set({ selectedCountry: 'en:chile' });
    }
  },

  // Agregar producto a la lista de compras
  addToWishlist: async (product) => {
    const wishlist = get().wishlist;
    const user = get().user;

    // Verificar si el producto ya existe (mismo ID o mismo barcode)
    const existingIndex = wishlist.findIndex(p => {
      // Comparar por ID si ambos tienen
      if (product.id && p.id && product.id === p.id) return true;
      // Comparar por barcode si ambos tienen
      if (product.barcode && p.barcode && product.barcode === p.barcode) return true;
      return false;
    });

    if (existingIndex >= 0) {
      // Si ya existe el mismo producto, incrementar cantidad
      const updated = [...wishlist];
      const newQuantity = (updated[existingIndex].quantity || 1) + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQuantity
      };
      set({ wishlist: updated });

      // Sincronizar con BD (Actualizar cantidad)
      if (user && user.id && product.id) {
        try {
          const { cartAPI } = await import('../services/api.js');
          await cartAPI.updateQuantity(user.id, product.id, newQuantity);
        } catch (error) {
          console.error('Error updating cart item quantity:', error);
        }
      }
    } else {
      // Agregar nuevo producto (producto diferente)
      set({ wishlist: [...wishlist, { ...product, quantity: 1 }] });

      // Sincronizar con BD (Agregar item)
      if (user && user.id && product.id) {
        try {
          const { cartAPI } = await import('../services/api.js');
          await cartAPI.addItem(user.id, product.id, 1);
        } catch (error) {
          console.error('Error adding item to cart:', error);
        }
      }
    }
  },

  // Remover producto de la lista de deseos
  removeFromWishlist: async (productId, userId = null) => {
    set({
      wishlist: get().wishlist.filter(p =>
        p.id !== productId && p.barcode !== productId
      )
    });

    // Sincronizar con BD
    if (userId) {
      try {
        const { cartAPI } = await import('../services/api.js');
        await cartAPI.removeItem(userId, productId);
      } catch (error) {
        console.error('Error removing from cart:', error);
      }
    }
  },

  // Actualizar cantidad de un producto
  updateQuantity: async (productId, quantity, userId = null) => {
    if (quantity <= 0) {
      get().removeFromWishlist(productId, userId);
      return;
    }

    const wishlist = get().wishlist.map(p =>
      (p.id === productId || p.barcode === productId)
        ? { ...p, quantity }
        : p
    );
    set({ wishlist });

    // Sincronizar con BD
    if (userId) {
      try {
        const { cartAPI } = await import('../services/api.js');
        await cartAPI.updateQuantity(userId, productId, quantity);
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }
  },

  // Limpiar lista de deseos
  clearWishlist: () => {
    set({ wishlist: [], optimizedList: null });
  },

  // Establecer lista optimizada
  setOptimizedList: (optimizedList) => {
    set({ optimizedList });
  },

  // Agregar producto para comparar
  addToCompare: (product) => {
    const productsToCompare = get().productsToCompare;
    if (productsToCompare.length >= 2) {
      set({ error: 'Solo puedes comparar 2 productos a la vez' });
      return;
    }

    // Verificar si el producto ya está en la lista de comparación
    // Comparar por ID si ambos tienen, o por barcode si ambos tienen, o por nombre como último recurso
    const isAlreadyAdded = productsToCompare.find(p => {
      // Si ambos tienen ID y son iguales
      if (product.id && p.id && product.id === p.id) return true;
      // Si ambos tienen barcode y son iguales
      if (product.barcode && p.barcode && product.barcode === p.barcode) return true;
      // Si ambos tienen nombre y barcode, y ambos coinciden
      if (product.name && p.name && product.name === p.name &&
        product.barcode && p.barcode && product.barcode === p.barcode) return true;
      return false;
    });

    if (!isAlreadyAdded) {
      set({ productsToCompare: [...productsToCompare, product] });
    }
  },

  // Remover producto de comparación
  removeFromCompare: (productId) => {
    set({
      productsToCompare: get().productsToCompare.filter(p =>
        p.id !== productId && p.barcode !== productId
      )
    });
  },

  // Limpiar productos para comparar
  clearCompare: () => {
    set({ productsToCompare: [] });
  },

  // Establecer estado de carga
  setLoading: (loading) => {
    set({ loading });
  },

  // Establecer error
  setError: (error) => {
    set({ error });
  }
}));

export default useShoppingStore;

