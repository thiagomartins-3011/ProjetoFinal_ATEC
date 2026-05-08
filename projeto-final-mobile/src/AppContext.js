import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { API_URL } from './config';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [authProvider, setAuthProvider] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [carrinho, setCarrinho] = useState([]);
  const carrinhoRef = useRef([]);

  useEffect(() => { carrinhoRef.current = carrinho; }, [carrinho]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('authProvider'),
    ]).then(([t, provider]) => {
      if (t) {
        setToken(t);
        setAuthProvider(provider);
        registarPushToken(t);
        axios.get(`${API_URL}/api/carrinho`, {
          headers: { Authorization: `Bearer ${t}` },
        }).then((res) => setCarrinho(res.data)).catch(() => {});
      }
      setCarregando(false);
    }).catch(() => setCarregando(false));
  }, []);

  const registarPushToken = async (authToken) => {
    try {
      if (!Device.isDevice) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });
      await axios.post(`${API_URL}/api/notifications/token`, { token: pushToken }, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {}
  };

  const login = async (novoToken, provider = null) => {
    await AsyncStorage.setItem('token', novoToken);
    if (provider) await AsyncStorage.setItem('authProvider', provider);
    else await AsyncStorage.removeItem('authProvider');
    setToken(novoToken);
    setAuthProvider(provider);
    registarPushToken(novoToken);
    const localCart = carrinhoRef.current;
    try {
      const res = await axios.get(`${API_URL}/api/carrinho`, {
        headers: { Authorization: `Bearer ${novoToken}` },
      });
      const remoto = res.data;
      const merged = [...remoto];
      for (const local of localCart) {
        const idx = merged.findIndex((i) => i.produto.id === local.produto.id);
        if (idx >= 0) {
          const novaQty = Math.min(merged[idx].produto.stock, merged[idx].quantidade + local.quantidade);
          merged[idx] = { ...merged[idx], quantidade: novaQty };
        } else {
          merged.push(local);
        }
        axios.post(`${API_URL}/api/carrinho`,
          { produtoId: local.produto.id, quantidade: local.quantidade },
          { headers: { Authorization: `Bearer ${novoToken}` } }
        ).catch(() => {});
      }
      setCarrinho(merged);
    } catch {
      setCarrinho(localCart);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'authProvider']);
    setToken(null);
    setAuthProvider(null);
    setCarrinho([]);
  };

  const addToCart = (produto, quantidade) => {
    const atual = carrinhoRef.current;
    const existente = atual.find((i) => i.produto.id === produto.id);
    const novaQty = existente
      ? Math.min(produto.stock, existente.quantidade + quantidade)
      : quantidade;

    if (existente) {
      setCarrinho(atual.map((i) =>
        i.produto.id === produto.id ? { ...i, quantidade: novaQty } : i
      ));
    } else {
      setCarrinho([...atual, { produto, quantidade: novaQty }]);
    }

    if (token) {
      axios.post(`${API_URL}/api/carrinho`,
        { produtoId: produto.id, quantidade: novaQty },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    }
  };

  const removeFromCart = (produtoId) => {
    setCarrinho(carrinhoRef.current.filter((i) => i.produto.id !== produtoId));
    if (token) {
      axios.delete(`${API_URL}/api/carrinho/${produtoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const updateQuantity = (produtoId, quantidade) => {
    if (quantidade <= 0) { removeFromCart(produtoId); return; }
    setCarrinho(carrinhoRef.current.map((i) =>
      i.produto.id === produtoId ? { ...i, quantidade } : i
    ));
    if (token) {
      axios.post(`${API_URL}/api/carrinho`,
        { produtoId, quantidade },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(() => {});
    }
  };

  const clearCart = () => setCarrinho([]);

  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  return (
    <AppContext.Provider value={{
      token, isLoggedIn: !!token, isGoogle: authProvider === 'google',
      carregando, carrinho, totalItens,
      login, logout, addToCart, removeFromCart, updateQuantity, clearCart,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
