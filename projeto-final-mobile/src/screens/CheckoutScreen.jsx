import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function CheckoutScreen({ navigation }) {
  const { token, carrinho, clearCart } = useApp();
  const [morada, setMorada] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [cidade, setCidade] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const total = carrinho.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      setMorada(res.data.morada || '');
      setCodigoPostal(res.data.codigoPostal || '');
      setCidade(res.data.cidade || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatCodigoPostal = (valor) => {
    const digitos = valor.replace(/\D/g, '').slice(0, 7);
    if (digitos.length <= 4) return digitos;
    return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  };

  const handleConfirmar = async () => {
    if (!morada.trim() || !codigoPostal.trim()) {
      Alert.alert('Campos obrigatórios', 'Preenche a morada e o código postal.');
      return;
    }
    setEnviando(true);
    try {
      await axios.post(`${API_URL}/api/encomendas`, {
        moradaEntrega: morada,
        codigoPostal,
        cidade,
        notas,
        items: carrinho.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
      }, { headers: { Authorization: `Bearer ${token}` } });

      await axios.delete(`${API_URL}/api/carrinho`, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      clearCart();
      setSucesso(true);
    } catch (err) {
      Alert.alert('Erro', err.response?.data || 'Erro ao processar a encomenda.');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;

  if (sucesso) {
    return (
      <View style={s.sucesso}>
        <Text style={s.sucessoIcone}>✅</Text>
        <Text style={s.sucessoTitulo}>Encomenda realizada!</Text>
        <Text style={s.sucessoSub}>Receberás atualizações sobre a tua encomenda.</Text>
        <TouchableOpacity
          style={s.btnSucesso}
          onPress={() => navigation.navigate('ContaTab', { screen: 'Encomendas' })}
        >
          <Text style={s.btnSucessoTxt}>Ver as minhas encomendas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnSucesso, { backgroundColor: C.cinzaClaro, marginTop: 10 }]}
          onPress={() => navigation.navigate('LojaTab')}
        >
          <Text style={[s.btnSucessoTxt, { color: C.preto }]}>Continuar a comprar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.secTitulo}>Morada de entrega</Text>

      <Text style={s.label}>Morada *</Text>
      <TextInput
        style={s.input}
        placeholder="Rua, nº, andar..."
        placeholderTextColor={C.textoSec}
        value={morada}
        onChangeText={setMorada}
      />

      <Text style={s.label}>Código postal *</Text>
      <TextInput
        style={s.input}
        placeholder="0000-000"
        placeholderTextColor={C.textoSec}
        value={codigoPostal}
        onChangeText={(v) => setCodigoPostal(formatCodigoPostal(v))}
        keyboardType="numeric"
        maxLength={8}
      />

      <Text style={s.label}>Cidade</Text>
      <TextInput
        style={s.input}
        placeholder="Cidade"
        placeholderTextColor={C.textoSec}
        value={cidade}
        onChangeText={setCidade}
      />

      <Text style={s.label}>Notas (opcional)</Text>
      <TextInput
        style={[s.input, { minHeight: 80 }]}
        placeholder="Instruções especiais de entrega..."
        placeholderTextColor={C.textoSec}
        value={notas}
        onChangeText={setNotas}
        multiline
        textAlignVertical="top"
      />

      <View style={s.resumo}>
        <Text style={s.resumoTitulo}>Resumo</Text>
        {carrinho.map((item) => (
          <View key={item.produto.id} style={s.resumoLinha}>
            <Text style={s.resumoNome} numberOfLines={1}>{item.produto.nome} × {item.quantidade}</Text>
            <Text style={s.resumoValor}>{(item.produto.preco * item.quantidade).toFixed(2)} €</Text>
          </View>
        ))}
        <View style={[s.resumoLinha, s.resumoTotal]}>
          <Text style={s.resumoTotalLabel}>Total</Text>
          <Text style={s.resumoTotalValor}>{total.toFixed(2)} €</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[s.btn, enviando && s.btnDisabled]}
        onPress={handleConfirmar}
        disabled={enviando}
        activeOpacity={0.85}
      >
        {enviando
          ? <ActivityIndicator color={C.preto} />
          : <Text style={s.btnTxt}>Confirmar encomenda</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  content: { padding: 16, paddingBottom: 32 },
  secTitulo: { fontSize: 17, fontWeight: '800', color: C.preto, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: C.textoSec, marginBottom: 4 },
  input: {
    backgroundColor: C.branco,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.preto,
    marginBottom: 14,
  },
  resumo: {
    backgroundColor: C.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    padding: 16,
    marginBottom: 20,
  },
  resumoTitulo: { fontSize: 15, fontWeight: '700', color: C.preto, marginBottom: 10 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  resumoNome: { flex: 1, fontSize: 13, color: C.textoSec, marginRight: 8 },
  resumoValor: { fontSize: 13, color: C.preto, fontWeight: '600' },
  resumoTotal: { borderTopWidth: 1, borderTopColor: C.cinzaBorda, paddingTop: 10, marginTop: 4 },
  resumoTotalLabel: { fontSize: 15, fontWeight: '700', color: C.preto },
  resumoTotalValor: { fontSize: 17, fontWeight: '800', color: C.amareloDark },
  btn: {
    backgroundColor: C.amarelo,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
  sucesso: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: C.branco },
  sucessoIcone: { fontSize: 56, marginBottom: 16 },
  sucessoTitulo: { fontSize: 22, fontWeight: '800', color: C.preto, marginBottom: 8, textAlign: 'center' },
  sucessoSub: { fontSize: 14, color: C.textoSec, textAlign: 'center', marginBottom: 32 },
  btnSucesso: { backgroundColor: C.amarelo, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  btnSucessoTxt: { fontSize: 15, fontWeight: '700', color: C.preto },
});
