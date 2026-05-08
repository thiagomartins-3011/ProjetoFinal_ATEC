import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function SegurancaScreen() {
  const { token, isGoogle } = useApp();
  const [loading, setLoading] = useState(true);
  const [utilizador, setUtilizador] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');
  const [sucesso, setSucesso] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMsg('');
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setUtilizador(res.data))
        .catch(() => setMsg('Erro ao carregar dados.'))
        .finally(() => setLoading(false));
    }, [token])
  );

  const handleToggle2FA = async () => {
    setMsg('');
    setSucesso(false);
    setEnviando(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/toggle-2fa`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUtilizador((prev) => ({ ...prev, twoFactorHabilitado: res.data.habilitado }));
      setSucesso(true);
      setMsg(res.data.habilitado
        ? 'Verificação em dois passos ativada.'
        : 'Verificação em dois passos desativada.'
      );
    } catch (err) {
      setMsg(err.response?.data || 'Erro ao alterar a configuração.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;

  const isAdmin = utilizador?.tipo === '1' || utilizador?.tipo === 1;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.card}>
        <Text style={s.secao}>Verificação em dois passos</Text>
        <Text style={s.descricao}>
          {isGoogle
            ? 'A autenticação é gerida pela tua conta Google.'
            : isAdmin
              ? 'Obrigatória para administradores e não pode ser desativada.'
              : 'Ao ativar, receberás um código por email sempre que fizeres login.'}
        </Text>

        <View style={s.row}>
          <View style={s.estadoWrap}>
            <Text style={s.estadoLabel}>Estado</Text>
            <Text style={[s.estadoBadge, utilizador?.twoFactorHabilitado ? s.ativo : s.inativo]}>
              {utilizador?.twoFactorHabilitado ? 'Ativado' : 'Desativado'}
            </Text>
          </View>

          {isGoogle ? (
            <View style={s.badgeGoogle}>
              <Text style={s.badgeGoogleTxt}>Conta Google</Text>
            </View>
          ) : !isAdmin ? (
            <TouchableOpacity
              style={[s.btn, utilizador?.twoFactorHabilitado ? s.btnPerigo : s.btnPrimary, enviando && s.btnDisabled]}
              onPress={handleToggle2FA}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando
                ? <ActivityIndicator color={C.preto} size="small" />
                : <Text style={s.btnTxt}>
                    {utilizador?.twoFactorHabilitado ? 'Desativar' : 'Ativar'}
                  </Text>
              }
            </TouchableOpacity>
          ) : null}
        </View>

        {msg !== '' && (
          <Text style={[s.msg, sucesso ? s.msgSucesso : s.msgErro]}>{msg}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  content: { padding: 20 },
  card: {
    backgroundColor: C.branco, borderRadius: 20,
    borderWidth: 1, borderColor: C.cinzaBorda, padding: 24,
  },
  secao: { fontSize: 13, fontWeight: '700', color: C.textoSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  descricao: { fontSize: 14, color: C.textoSec, marginBottom: 20, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  estadoWrap: { gap: 6 },
  estadoLabel: { fontSize: 13, color: C.textoSec },
  estadoBadge: { fontSize: 14, fontWeight: '700', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  ativo: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
  inativo: { backgroundColor: '#f5f5f5', color: C.textoSec },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.amarelo },
  btnPerigo: { backgroundColor: '#fdecea', borderWidth: 1, borderColor: '#e57373' },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { fontSize: 14, fontWeight: '700', color: C.preto },
  msg: { fontSize: 13, marginTop: 16, padding: 10, borderRadius: 8 },
  msgSucesso: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
  msgErro: { backgroundColor: '#fdecea', color: '#c62828' },
  badgeGoogle: { backgroundColor: C.amarelo, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeGoogleTxt: { fontSize: 13, fontWeight: '700', color: C.preto },
});
