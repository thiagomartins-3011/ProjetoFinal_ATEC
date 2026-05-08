import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { GoogleSignin, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

GoogleSignin.configure({
  webClientId: '606144369056-rj1pvvqnlp51c41p921qatl2nplahp6e.apps.googleusercontent.com',
});

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const { login } = useApp();

  const handleGoogleSignIn = async () => {
    setErro('');
    setEnviando(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (isSuccessResponse(response)) {
        const res = await axios.post(`${API_URL}/api/auth/google-login`, { token: response.data.idToken });
        await login(res.data.token, 'google');
        navigation.reset({ index: 0, routes: [{ name: 'ContaMain' }] });
      }
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        setErro('Erro ao autenticar com Google.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErro('Preenche o e-mail e a password.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      if (res.data.requires2fa) {
        setTwoFactorEmail(email);
        setRequires2fa(true);
      } else {
        await login(res.data.token);
        navigation.reset({ index: 0, routes: [{ name: 'ContaMain' }] });
      }
    } catch (err) {
      setErro(err.response?.data || 'E-mail ou password incorretos.');
    } finally {
      setEnviando(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!codigo.trim()) {
      setErro('Insere o código de verificação.');
      return;
    }
    setErro('');
    setEnviando(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-2fa`, { email: twoFactorEmail, codigo });
      await login(res.data.token);
      navigation.reset({ index: 0, routes: [{ name: 'ContaMain' }] });
    } catch (err) {
      setErro(err.response?.data || 'Código incorreto ou expirado.');
    } finally {
      setEnviando(false);
    }
  };

  if (requires2fa) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.titulo}>Verificação em dois passos</Text>
          <Text style={s.sub}>Enviámos um código de 6 dígitos para {twoFactorEmail}</Text>

          <Text style={s.label}>Código de verificação</Text>
          <TextInput
            style={s.input}
            placeholder="000000"
            placeholderTextColor={C.textoSec}
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
            maxLength={6}
          />

          {erro !== '' && <Text style={s.erro}>{erro}</Text>}

          <TouchableOpacity
            style={[s.btn, enviando && s.btnDisabled]}
            onPress={handleVerify2FA}
            disabled={enviando}
            activeOpacity={0.85}
          >
            {enviando
              ? <ActivityIndicator color={C.preto} />
              : <Text style={s.btnTxt}>Verificar</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.linkWrap} onPress={() => { setRequires2fa(false); setCodigo(''); setErro(''); }}>
            <Text style={s.linkTxt}><Text style={s.link}>Voltar ao login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.card}>
        <Text style={s.titulo}>Bem-vindo de volta</Text>
        <Text style={s.sub}>Entra na tua conta SoundStore</Text>

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
          placeholder="A tua password"
          placeholderTextColor={C.textoSec}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {erro !== '' && <Text style={s.erro}>{erro}</Text>}

        <TouchableOpacity
          style={[s.btn, enviando && s.btnDisabled]}
          onPress={handleLogin}
          disabled={enviando}
          activeOpacity={0.85}
        >
          {enviando
            ? <ActivityIndicator color={C.preto} />
            : <Text style={s.btnTxt}>Entrar</Text>
          }
        </TouchableOpacity>

        <View style={s.separador}>
          <View style={s.linha} />
          <Text style={s.separadorTxt}>ou</Text>
          <View style={s.linha} />
        </View>

        <TouchableOpacity
          style={[s.btnGoogle, enviando && s.btnDisabled]}
          onPress={handleGoogleSignIn}
          disabled={enviando}
          activeOpacity={0.85}
        >
          <Text style={s.btnGoogleTxt}>Entrar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.linkWrap} onPress={() => navigation.navigate('Register')}>
          <Text style={s.linkTxt}>Não tens conta? <Text style={s.link}>Criar conta</Text></Text>
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
  separador: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  linha: { flex: 1, height: 1, backgroundColor: C.cinzaBorda },
  separadorTxt: { marginHorizontal: 10, fontSize: 13, color: C.textoSec },
  btnGoogle: {
    backgroundColor: C.branco,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    marginBottom: 4,
  },
  btnGoogleTxt: { fontSize: 15, fontWeight: '700', color: C.preto },
  linkWrap: { marginTop: 16, alignItems: 'center' },
  linkTxt: { fontSize: 14, color: C.textoSec },
  link: { color: C.amareloDark, fontWeight: '700' },
});
