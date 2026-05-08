import { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

export default function ProdutoScreen({ route }) {
  const { produtoId } = route.params;
  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemAtiva, setImagemAtiva] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const { addToCart } = useApp();

  useEffect(() => {
    setLoading(true);
    setImagemAtiva(0);
    setQuantidade(1);
    axios.get(`${API_URL}/api/produtos/${produtoId}`)
      .then((res) => setProduto(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [produtoId]);

  if (loading) {
    return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;
  }

  if (!produto) {
    return <Text style={s.erro}>Produto não encontrado.</Text>;
  }

  const imagens = produto.imagens || [];
  const imagemAtual = imagens[imagemAtiva] || null;
  const semStock = produto.stock === 0;

  const handleAdicionarCarrinho = () => {
    if (semStock) return;
    addToCart(produto, quantidade);
    Alert.alert('Carrinho', `"${produto.nome}" adicionado ao carrinho!`);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Imagem principal */}
      <View style={s.imagemWrap}>
        {imagemAtual ? (
          <Image
            source={{ uri: `${API_URL}${imagemAtual.url}` }}
            style={s.imagem}
            resizeMode="contain"
          />
        ) : (
          <View style={[s.imagem, s.imagemPlaceholder]}>
            <Text style={{ fontSize: 48 }}>🎵</Text>
          </View>
        )}
        {semStock && (
          <View style={s.badgeEsgotado}>
            <Text style={s.badgeEsgotadoTxt}>ESGOTADO</Text>
          </View>
        )}
      </View>

      {/* Miniaturas */}
      {imagens.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbsScroll}>
          {imagens.map((img, i) => (
            <TouchableOpacity key={i} onPress={() => setImagemAtiva(i)}>
              <Image
                source={{ uri: `${API_URL}${img.url}` }}
                style={[s.thumb, imagemAtiva === i && s.thumbAtivo]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Info */}
      <View style={s.info}>
        {produto.nomeMarca && <Text style={s.marca}>{produto.nomeMarca}</Text>}
        <Text style={s.nome}>{produto.nome}</Text>
        <Text style={s.preco}>{Number(produto.preco).toFixed(2)} €</Text>
        <Text style={s.stock}>
          {semStock ? '❌ Esgotado' : `✅ Em stock (${produto.stock} disponíveis)`}
        </Text>

        {produto.descricao && (
          <Text style={s.descricao}>{produto.descricao}</Text>
        )}

        {/* Quantidade */}
        {!semStock && (
          <View style={s.qtyWrap}>
            <Text style={s.qtyLabel}>Quantidade:</Text>
            <View style={s.qtyControls}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setQuantidade(Math.max(1, quantidade - 1))}
              >
                <Text style={s.qtyBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.qtyNum}>{quantidade}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => setQuantidade(Math.min(produto.stock, quantidade + 1))}
              >
                <Text style={s.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botão */}
        <TouchableOpacity
          style={[s.btnAdd, semStock && s.btnDisabled]}
          onPress={handleAdicionarCarrinho}
          disabled={semStock}
          activeOpacity={0.8}
        >
          <Text style={s.btnAddTxt}>
            {semStock ? 'Indisponível' : 'Adicionar ao carrinho'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.branco },
  content: { paddingBottom: 32 },
  erro: { textAlign: 'center', marginTop: 60, color: C.textoSec, fontSize: 16 },
  imagemWrap: { position: 'relative' },
  imagem: { width: '100%', height: 280, backgroundColor: C.cinzaClaro },
  imagemPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  badgeEsgotado: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: '#555', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeEsgotadoTxt: { color: C.branco, fontWeight: '800', fontSize: 11 },
  thumbsScroll: { marginTop: 8, paddingHorizontal: 16 },
  thumb: {
    width: 64, height: 64, borderRadius: 8,
    marginRight: 8, borderWidth: 1, borderColor: C.cinzaBorda,
    backgroundColor: C.cinzaClaro,
  },
  thumbAtivo: { borderColor: C.amarelo, borderWidth: 2 },
  info: { padding: 20 },
  marca: { fontSize: 13, color: C.textoSec, marginBottom: 4 },
  nome: { fontSize: 20, fontWeight: '800', color: C.preto, marginBottom: 8 },
  preco: { fontSize: 24, fontWeight: '800', color: C.amareloDark, marginBottom: 8 },
  stock: { fontSize: 13, color: C.textoSec, marginBottom: 12 },
  descricao: { fontSize: 14, color: C.textoSec, lineHeight: 22, marginBottom: 20 },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: C.preto },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: C.cinzaClaro, borderWidth: 1, borderColor: C.cinzaBorda,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnTxt: { fontSize: 18, fontWeight: '600', color: C.preto },
  qtyNum: { fontSize: 17, fontWeight: '700', color: C.preto, minWidth: 24, textAlign: 'center' },
  btnAdd: {
    backgroundColor: C.amarelo,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: C.cinzaBorda },
  btnAddTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
});
