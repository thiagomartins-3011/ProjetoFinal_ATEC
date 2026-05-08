import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function ContaScreen({ navigation }) {
  const { isLoggedIn, token, logout } = useApp();
  const [utilizador, setUtilizador] = useState(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn) { setUtilizador(null); return; }
      setLoading(true);
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setUtilizador(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, [isLoggedIn, token])
  );

  if (!isLoggedIn) {
    return (
      <View style={s.centrado}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>👤</Text>
        <Text style={s.titulo}>A tua conta</Text>
        <Text style={s.sub}>Entra ou cria uma conta para fazer encomendas e acompanhar as tuas compras.</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={s.btnTxt}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={() => navigation.navigate('Register')}>
          <Text style={[s.btnTxt, { color: C.preto }]}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Card do utilizador */}
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{utilizador?.nome?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={s.nome}>{utilizador?.nome}</Text>
        <Text style={s.email}>{utilizador?.email}</Text>
      </View>

      {/* Ações */}
      <View style={s.menuWrap}>
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Encomendas')}>
          <Text style={s.menuIcone}>📦</Text>
          <View style={s.menuTexto}>
            <Text style={s.menuLabel}>Encomendas</Text>
            <Text style={s.menuSub}>Histórico e estado das encomendas</Text>
          </View>
          <Text style={s.menuSeta}>›</Text>
        </TouchableOpacity>
        <View style={s.separador} />
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Perfil')}>
          <Text style={s.menuIcone}>👤</Text>
          <View style={s.menuTexto}>
            <Text style={s.menuLabel}>Perfil</Text>
            <Text style={s.menuSub}>Edita os teus dados pessoais</Text>
          </View>
          <Text style={s.menuSeta}>›</Text>
        </TouchableOpacity>
        <View style={s.separador} />
        <TouchableOpacity style={s.menuItem} onPress={() => navigation.navigate('Seguranca')}>
          <Text style={s.menuIcone}>🔒</Text>
          <View style={s.menuTexto}>
            <Text style={s.menuLabel}>Segurança</Text>
            <Text style={s.menuSub}>Verificação em dois passos</Text>
          </View>
          <Text style={s.menuSeta}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btnSair} onPress={logout}>
        <Text style={s.btnSairTxt}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  content: { padding: 20, paddingBottom: 40 },
  centrado: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, backgroundColor: C.cinzaClaro,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: C.preto, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: C.textoSec, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  btn: {
    backgroundColor: C.amarelo, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
    alignItems: 'center', width: '100%', marginBottom: 10,
  },
  btnOutline: { backgroundColor: C.branco, borderWidth: 1, borderColor: C.cinzaBorda },
  btnTxt: { fontSize: 15, fontWeight: '700', color: C.preto },
  card: {
    backgroundColor: C.branco, borderRadius: 20,
    borderWidth: 1, borderColor: C.cinzaBorda,
    padding: 24, alignItems: 'center', marginBottom: 20,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.amarelo, alignItems: 'center',
    justifyContent: 'center', marginBottom: 12,
  },
  avatarTxt: { fontSize: 26, fontWeight: '800', color: C.preto },
  nome: { fontSize: 18, fontWeight: '800', color: C.preto, marginBottom: 4 },
  email: { fontSize: 13, color: C.textoSec },
  menuWrap: {
    backgroundColor: C.branco, borderRadius: 16,
    borderWidth: 1, borderColor: C.cinzaBorda, marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, gap: 14,
  },
  menuIcone: { fontSize: 22 },
  menuTexto: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: C.preto },
  menuSub: { fontSize: 12, color: C.textoSec, marginTop: 2 },
  menuSeta: { fontSize: 22, color: C.textoSec },
  separador: { height: 1, backgroundColor: C.cinzaBorda, marginHorizontal: 16 },
  btnSair: {
    backgroundColor: C.branco, borderRadius: 12,
    borderWidth: 1, borderColor: C.cinzaBorda,
    paddingVertical: 14, alignItems: 'center',
  },
  btnSairTxt: { fontSize: 15, fontWeight: '700', color: C.perigo },
});
