import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function RegisterScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const { login } = useApp();

  const handleRegistar = async () => {
    if (!nome.trim() || !email.trim() || !password.trim()) {
      setErro('Preenche todos os campos.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/register`, { nome, email, password });
      if (res.data.token) {
        await login(res.data.token);
        navigation.navigate('ContaMain');
      } else {
        setSucesso(true);
      }
    } catch (err) {
      setErro(err.response?.data || 'Erro ao criar conta.');
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <View style={s.sucessoWrap}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📧</Text>
        <Text style={s.titulo}>Confirma o teu e-mail</Text>
        <Text style={s.sub}>Enviámos um link de confirmação para {email}. Verifica a tua caixa de entrada.</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={s.btnTxt}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.titulo}>Criar conta</Text>
        <Text style={s.sub}>Junta-te à SoundStore</Text>

        <Text style={s.label}>Nome</Text>
        <TextInput
          style={s.input}
          placeholder="O teu nome"
          placeholderTextColor={C.textoSec}
          value={nome}
          onChangeText={setNome}
        />

        <Text style={s.label}>E-mail</Text>
        <TextInput
          style={s.input}
          placeholder="o.teu@email.com"
          placeholderTextColor={C.textoSec}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={s.label}>Password</Text>
        <TextInput
          style={s.input}
          placeholder="Escolhe uma password"
          placeholderTextColor={C.textoSec}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {erro !== '' && <Text style={s.erro}>{erro}</Text>}

        <TouchableOpacity
          style={[s.btn, enviando && s.btnDisabled]}
          onPress={handleRegistar}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color={C.preto} />
            : <Text style={s.btnTxt}>Criar conta</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={s.linkTxt}>Já tens conta? <Text style={s.link}>Entrar</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: C.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    padding: 28,
  },
  titulo: { fontSize: 22, fontWeight: '800', color: C.preto, marginBottom: 4 },
  sub: { fontSize: 14, color: C.textoSec, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: C.textoSec, marginBottom: 4 },
  input: {
    backgroundColor: C.cinzaClaro,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.preto,
    marginBottom: 14,
  },
  erro: { color: C.perigo, fontSize: 13, marginBottom: 12 },
  btn: {
    backgroundColor: C.amarelo,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
  linkWrap: { marginTop: 16, alignItems: 'center' },
  linkTxt: { fontSize: 14, color: C.textoSec },
  link: { color: C.amareloDark, fontWeight: '700' },
  sucessoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: C.branco },
});
