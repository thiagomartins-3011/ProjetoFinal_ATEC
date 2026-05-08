import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function PerfilScreen() {
  const { token } = useApp();
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [morada, setMorada] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [cidade, setCidade] = useState('');

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setMsg('');
      axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const u = res.data;
        setNome(u.nome || '');
        setEmail(u.email || '');
        setTelefone(u.telefone || '');
        setMorada(u.morada || '');
        setCodigoPostal(u.codigoPostal || '');
        setCidade(u.cidade || '');
      }).catch(() => setMsg('Erro ao carregar dados.'))
        .finally(() => setLoading(false));
    }, [token])
  );

  const formatarCP = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 7);
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  };

  const handleGuardar = async () => {
    setMsg('');
    setSucesso(false);
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length > 0 && digitos.length !== 9) {
      setMsg('O telefone deve ter exatamente 9 dígitos.');
      return;
    }
    setEnviando(true);
    try {
      await axios.put(`${API_URL}/api/auth/profile`,
        { nome, telefone: digitos, morada, codigoPostal, cidade },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSucesso(true);
      setMsg('Perfil atualizado com sucesso.');
    } catch (err) {
      setMsg(err.response?.data || 'Erro ao guardar alterações.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.secao}>Dados pessoais</Text>

        <Text style={s.label}>Nome</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} placeholderTextColor={C.textoSec} />

        <Text style={s.label}>E-mail</Text>
        <TextInput style={[s.input, s.inputDisabled]} value={email} editable={false} />

        <Text style={s.label}>Telefone</Text>
        <TextInput
          style={s.input}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
          placeholder="9XX XXX XXX"
          placeholderTextColor={C.textoSec}
          maxLength={9}
        />

        <View style={s.divider} />
        <Text style={s.secao}>Morada de entrega</Text>

        <Text style={s.label}>Morada</Text>
        <TextInput
          style={s.input}
          value={morada}
          onChangeText={setMorada}
          placeholder="Rua, número, andar..."
          placeholderTextColor={C.textoSec}
        />

        <View style={s.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={s.label}>Código Postal</Text>
            <TextInput
              style={s.input}
              value={codigoPostal}
              onChangeText={(v) => setCodigoPostal(formatarCP(v))}
              placeholder="0000-000"
              placeholderTextColor={C.textoSec}
              keyboardType="numeric"
              maxLength={8}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Cidade</Text>
            <TextInput
              style={s.input}
              value={cidade}
              onChangeText={setCidade}
              placeholder="Lisboa"
              placeholderTextColor={C.textoSec}
            />
          </View>
        </View>

        {msg !== '' && (
          <Text style={[s.msg, sucesso ? s.msgSucesso : s.msgErro]}>{msg}</Text>
        )}

        <TouchableOpacity
          style={[s.btn, enviando && s.btnDisabled]}
          onPress={handleGuardar}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color={C.preto} />
            : <Text style={s.btnTxt}>Guardar alterações</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: C.branco, borderRadius: 20,
    borderWidth: 1, borderColor: C.cinzaBorda, padding: 24,
  },
  secao: { fontSize: 13, fontWeight: '700', color: C.textoSec, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontSize: 13, fontWeight: '600', color: C.textoSec, marginBottom: 4 },
  input: {
    backgroundColor: C.cinzaClaro, borderRadius: 10,
    borderWidth: 1, borderColor: C.cinzaBorda,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: C.preto, marginBottom: 14,
  },
  inputDisabled: { opacity: 0.5 },
  row: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: C.cinzaBorda, marginVertical: 16 },
  msg: { fontSize: 13, marginBottom: 12, padding: 10, borderRadius: 8 },
  msgSucesso: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
  msgErro: { backgroundColor: '#fdecea', color: '#c62828' },
  btn: {
    backgroundColor: C.amarelo, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
});
