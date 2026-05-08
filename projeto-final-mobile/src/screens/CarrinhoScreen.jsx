import {
  View, Text, FlatList, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { C } from '../theme';
import { useApp } from '../AppContext';
import { API_URL } from '../config';

export default function CarrinhoScreen({ navigation }) {
  const { carrinho, isLoggedIn, removeFromCart, updateQuantity } = useApp();

  const total = carrinho.reduce((acc, i) => acc + i.produto.preco * i.quantidade, 0);

  if (carrinho.length === 0) {
    return (
      <View style={s.vazio}>
        <Text style={s.vazioIcone}>🛒</Text>
        <Text style={s.vazioTitulo}>Carrinho vazio</Text>
        <Text style={s.vazioSub}>Ainda não adicionaste produtos.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={s.item}>
      {item.produto.imagemPrincipal ? (
        <Image
          source={{ uri: `${API_URL}${item.produto.imagemPrincipal}` }}
          style={s.itemImg}
          resizeMode="contain"
        />
      ) : (
        <View style={[s.itemImg, s.itemImgPlaceholder]}>
          <Text style={{ fontSize: 20 }}>🎵</Text>
        </View>
      )}
      <View style={s.itemInfo}>
        <Text style={s.itemNome} numberOfLines={2}>{item.produto.nome}</Text>
        <Text style={s.itemPreco}>{Number(item.produto.preco).toFixed(2)} €</Text>
        <View style={s.qtyRow}>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => updateQuantity(item.produto.id, item.quantidade - 1)}
          >
            <Text style={s.qtyBtnTxt}>−</Text>
          </TouchableOpacity>
          <Text style={s.qtyNum}>{item.quantidade}</Text>
          <TouchableOpacity
            style={s.qtyBtn}
            onPress={() => updateQuantity(item.produto.id, Math.min(item.produto.stock, item.quantidade + 1))}
          >
            <Text style={s.qtyBtnTxt}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={s.remover} onPress={() => removeFromCart(item.produto.id)}>
        <Text style={s.removerTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <FlatList
        data={carrinho}
        keyExtractor={(item) => String(item.produto.id)}
        renderItem={renderItem}
        contentContainerStyle={s.lista}
      />

      <View style={s.rodape}>
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValor}>{total.toFixed(2)} €</Text>
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            style={s.btnCheckout}
            onPress={() => navigation.navigate('Checkout')}
            activeOpacity={0.85}
          >
            <Text style={s.btnCheckoutTxt}>Finalizar encomenda</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={s.loginAviso}>Tens de iniciar sessão para finalizar a encomenda.</Text>
            <TouchableOpacity
              style={s.btnCheckout}
              onPress={() => navigation.navigate('ContaTab', { screen: 'Login' })}
              activeOpacity={0.85}
            >
              <Text style={s.btnCheckoutTxt}>Iniciar sessão</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },
  lista: { padding: 12, paddingBottom: 0 },
  item: {
    flexDirection: 'row',
    backgroundColor: C.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  itemImg: { width: 70, height: 70, borderRadius: 8, backgroundColor: C.cinzaClaro },
  itemImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemNome: { fontSize: 13, fontWeight: '600', color: C.preto, lineHeight: 18 },
  itemPreco: { fontSize: 14, fontWeight: '800', color: C.amareloDark, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: C.cinzaClaro, borderWidth: 1, borderColor: C.cinzaBorda,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnTxt: { fontSize: 16, fontWeight: '600', color: C.preto },
  qtyNum: { fontSize: 15, fontWeight: '700', color: C.preto, minWidth: 20, textAlign: 'center' },
  remover: { padding: 8 },
  removerTxt: { fontSize: 16, color: C.textoSec },
  rodape: {
    backgroundColor: C.branco,
    borderTopWidth: 1,
    borderTopColor: C.cinzaBorda,
    padding: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: C.preto },
  totalValor: { fontSize: 20, fontWeight: '800', color: C.amareloDark },
  loginAviso: { fontSize: 13, color: C.textoSec, textAlign: 'center', marginBottom: 10 },
  btnCheckout: {
    backgroundColor: C.amarelo,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnCheckoutTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cinzaClaro },
  vazioIcone: { fontSize: 52, marginBottom: 12 },
  vazioTitulo: { fontSize: 20, fontWeight: '800', color: C.preto, marginBottom: 6 },
  vazioSub: { fontSize: 14, color: C.textoSec },
});
