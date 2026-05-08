import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
  Dimensions, Modal, SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 30) / 2;

export default function CatalogoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [promocoes, setPromocoes] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [modoPromocoes, setModoPromocoes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [marcasSelecionadas, setMarcasSelecionadas] = useState(new Set());
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  // Filtros temporários dentro do modal (só aplicados ao clicar "Aplicar")
  const [marcasTemp, setMarcasTemp] = useState(new Set());
  const [precoMinTemp, setPrecoMinTemp] = useState('');
  const [precoMaxTemp, setPrecoMaxTemp] = useState('');

  const carregarProdutos = useCallback(async (catId = categoriaAtiva) => {
    try {
      const url = catId
        ? `${API_URL}/api/produtos?categoriaId=${catId}&incluirSubcategorias=true`
        : `${API_URL}/api/produtos`;
      const res = await axios.get(url);
      setProdutos(res.data);
    } catch {}
  }, [categoriaAtiva]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const prodUrl = categoriaAtiva
        ? `${API_URL}/api/produtos?categoriaId=${categoriaAtiva}&incluirSubcategorias=true`
        : `${API_URL}/api/produtos`;
      Promise.all([
        axios.get(`${API_URL}/api/categorias`),
        axios.get(prodUrl),
        axios.get(`${API_URL}/api/produtos?emPromocao=true`),
      ]).then(([catRes, prodRes, promoRes]) => {
        setCategorias(catRes.data.filter((c) => !c.idPai));
        setProdutos(prodRes.data);
        setPromocoes(promoRes.data);
      }).catch(() => {}).finally(() => setLoading(false));
    }, [categoriaAtiva])
  );

  const handleCategoria = async (id) => {
    setModoPromocoes(false);
    const nova = categoriaAtiva === id ? null : id;
    setCategoriaAtiva(nova);
    setLoading(true);
    await carregarProdutos(nova);
    setLoading(false);
  };

  const handlePromocoes = async () => {
    setCategoriaAtiva(null);
    const ativo = !modoPromocoes;
    setModoPromocoes(ativo);
    if (ativo) {
      try {
        const r = await axios.get(`${API_URL}/api/produtos?emPromocao=true`);
        setPromocoes(r.data);
      } catch {}
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      carregarProdutos(categoriaAtiva),
      axios.get(`${API_URL}/api/produtos?emPromocao=true`)
        .then((r) => setPromocoes(r.data))
        .catch(() => {}),
    ]);
    setRefreshing(false);
  };

  // Marcas disponíveis nos produtos atuais
  const marcasDisponiveis = useMemo(() => {
    const listaBase = modoPromocoes ? promocoes : produtos;
    const map = new Map();
    listaBase.forEach((p) => {
      if (p.idMarca) map.set(Number(p.idMarca), p.nomeMarca);
    });
    return Array.from(map.entries())
      .map(([id, nome]) => ({ id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [produtos, promocoes, modoPromocoes]);

  const listaBase = modoPromocoes ? promocoes : produtos;

  const produtosFiltrados = listaBase.filter((p) => {
    if (pesquisa && !p.nome.toLowerCase().includes(pesquisa.toLowerCase())) return false;
    if (marcasSelecionadas.size > 0 && !marcasSelecionadas.has(Number(p.idMarca))) return false;
    if (precoMin !== '' && Number(p.preco) < Number(precoMin)) return false;
    if (precoMax !== '' && Number(p.preco) > Number(precoMax)) return false;
    return true;
  });

  const totalFiltrosAtivos = marcasSelecionadas.size + (precoMin !== '' ? 1 : 0) + (precoMax !== '' ? 1 : 0);

  const abrirFiltros = () => {
    setMarcasTemp(new Set(marcasSelecionadas));
    setPrecoMinTemp(precoMin);
    setPrecoMaxTemp(precoMax);
    setFiltrosVisiveis(true);
  };

  const aplicarFiltros = () => {
    setMarcasSelecionadas(new Set(marcasTemp));
    setPrecoMin(precoMinTemp);
    setPrecoMax(precoMaxTemp);
    setFiltrosVisiveis(false);
  };

  const limparFiltros = () => {
    setMarcasSelecionadas(new Set());
    setPrecoMin('');
    setPrecoMax('');
    setMarcasTemp(new Set());
    setPrecoMinTemp('');
    setPrecoMaxTemp('');
  };

  const limparFiltrosModal = () => {
    setMarcasTemp(new Set());
    setPrecoMinTemp('');
    setPrecoMaxTemp('');
    setMarcasSelecionadas(new Set());
    setPrecoMin('');
    setPrecoMax('');
    setFiltrosVisiveis(false);
  };

  const toggleMarcaTemp = (id) => {
    setMarcasTemp((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const renderProduto = ({ item }) => {
    const semStock = item.stock === 0;
    const pct = Number(item.promocao) || 0;
    const precoOrig = Number(item.preco);
    const precoFinal = pct > 0 ? +(precoOrig * (1 - pct / 100)).toFixed(2) : null;

    return (
      <TouchableOpacity
        style={[s.card, semStock && s.cardEsgotado]}
        onPress={() => navigation.navigate('Produto', { produtoId: item.id })}
        activeOpacity={0.85}
      >
        {item.imagemPrincipal ? (
          <Image
            source={{ uri: `${API_URL}${item.imagemPrincipal}` }}
            style={[s.cardImg, semStock && { opacity: 0.4 }]}
            resizeMode="contain"
          />
        ) : (
          <View style={[s.cardImgPlaceholder, semStock && { opacity: 0.4 }]}>
            <Text style={{ fontSize: 28 }}>🎵</Text>
          </View>
        )}
        {semStock && (
          <View style={s.badgeEsgotado}>
            <Text style={s.badgeEsgotadoTxt}>ESGOTADO</Text>
          </View>
        )}
        {pct > 0 && !semStock && (
          <View style={s.badgePromocao}>
            <Text style={s.badgePromocaoTxt}>-{pct}%</Text>
          </View>
        )}
        <Text style={s.cardNome} numberOfLines={2}>{item.nome}</Text>
        {item.nomeMarca && <Text style={s.cardMarca}>{item.nomeMarca}</Text>}
        {precoFinal !== null ? (
          <View>
            <Text style={s.cardPrecoOriginal}>{precoOrig.toFixed(2)} €</Text>
            <Text style={s.cardPreco}>{precoFinal.toFixed(2)} €</Text>
          </View>
        ) : (
          <Text style={s.cardPreco}>{precoOrig.toFixed(2)} €</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      {/* Barra de pesquisa + botão filtros */}
      <View style={s.pesquisaWrap}>
        <TextInput
          style={s.pesquisaInput}
          placeholder="Pesquisar produtos..."
          placeholderTextColor={C.textoSec}
          value={pesquisa}
          onChangeText={setPesquisa}
        />
        <TouchableOpacity
          style={[s.filtroBtn, totalFiltrosAtivos > 0 && s.filtroBtnAtivo]}
          onPress={abrirFiltros}
        >
          <Text style={[s.filtroBtnTxt, totalFiltrosAtivos > 0 && s.filtroBtnTxtAtivo]}>
            ⚙ Filtros
          </Text>
          {totalFiltrosAtivos > 0 && (
            <View style={s.filtroBadge}>
              <Text style={s.filtroBadgeTxt}>{totalFiltrosAtivos}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filtro de categorias + Promoções */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.categoriasScroll}
        contentContainerStyle={s.categoriasContent}
      >
        <TouchableOpacity
          style={[s.catBtn, !categoriaAtiva && !modoPromocoes && s.catBtnAtivo]}
          onPress={() => handleCategoria(null)}
        >
          <Text style={[s.catBtnTxt, !categoriaAtiva && !modoPromocoes && s.catBtnTxtAtivo]}>
            Todos
          </Text>
        </TouchableOpacity>

        {promocoes.length > 0 && (
          <TouchableOpacity
            style={[s.catBtn, s.catBtnPromo, modoPromocoes && s.catBtnPromoAtivo]}
            onPress={handlePromocoes}
          >
            <Text style={[s.catBtnTxt, modoPromocoes && s.catBtnTxtAtivo]}>
              🏷️ Promoções
            </Text>
          </TouchableOpacity>
        )}

        {categorias.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catBtn, categoriaAtiva === cat.id && s.catBtnAtivo]}
            onPress={() => handleCategoria(cat.id)}
          >
            <Text style={[s.catBtnTxt, categoriaAtiva === cat.id && s.catBtnTxtAtivo]}>
              {cat.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicador de filtros ativos */}
      {totalFiltrosAtivos > 0 && (
        <View style={s.filtrosAtivosWrap}>
          <Text style={s.filtrosAtivosTxt}>
            {totalFiltrosAtivos} filtro{totalFiltrosAtivos > 1 ? 's' : ''} ativo{totalFiltrosAtivos > 1 ? 's' : ''} · {produtosFiltrados.length} resultado{produtosFiltrados.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={limparFiltros}>
            <Text style={s.filtrosLimpar}>Limpar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de produtos */}
      {loading ? (
        <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 40 }} />
      ) : produtosFiltrados.length === 0 ? (
        <Text style={s.vazio}>Nenhum produto encontrado.</Text>
      ) : (
        <FlatList
          data={produtosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduto}
          numColumns={2}
          columnWrapperStyle={s.row}
          contentContainerStyle={s.lista}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.amarelo]} />}
        />
      )}

      {/* Modal de filtros */}
      <Modal
        visible={filtrosVisiveis}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltrosVisiveis(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setFiltrosVisiveis(false)}
        />
        <SafeAreaView style={s.modalContainer}>
          {/* Cabeçalho */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitulo}>Filtros</Text>
            <TouchableOpacity onPress={limparFiltrosModal}>
              <Text style={s.modalLimpar}>Limpar tudo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
            {/* Filtro de preço */}
            <Text style={s.secaoTitulo}>Preço (€)</Text>
            <View style={s.precoRow}>
              <TextInput
                style={s.precoInput}
                placeholder="Mín"
                placeholderTextColor={C.textoSec}
                keyboardType="numeric"
                value={precoMinTemp}
                onChangeText={setPrecoMinTemp}
              />
              <Text style={s.precoSep}>–</Text>
              <TextInput
                style={s.precoInput}
                placeholder="Máx"
                placeholderTextColor={C.textoSec}
                keyboardType="numeric"
                value={precoMaxTemp}
                onChangeText={setPrecoMaxTemp}
              />
            </View>

            {/* Filtro de marcas */}
            {marcasDisponiveis.length > 0 && (
              <>
                <Text style={[s.secaoTitulo, { marginTop: 24 }]}>Marca</Text>
                {marcasDisponiveis.map((marca) => {
                  const selecionada = marcasTemp.has(marca.id);
                  return (
                    <TouchableOpacity
                      key={marca.id}
                      style={s.marcaRow}
                      onPress={() => toggleMarcaTemp(marca.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.checkbox, selecionada && s.checkboxAtivo]}>
                        {selecionada && <Text style={s.checkboxCheck}>✓</Text>}
                      </View>
                      <Text style={s.marcaNome}>{marca.nome}</Text>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Botão aplicar */}
          <View style={[s.modalFooter, { paddingBottom: (insets.bottom || 12) + 4 }]}>
            <TouchableOpacity style={s.aplicarBtn} onPress={aplicarFiltros}>
              <Text style={s.aplicarBtnTxt}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cinzaClaro },

  pesquisaWrap: { padding: 12, paddingBottom: 0, flexDirection: 'row', gap: 8 },
  pesquisaInput: {
    flex: 1,
    backgroundColor: C.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.preto,
  },
  filtroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  filtroBtnAtivo: { backgroundColor: C.amarelo, borderColor: C.amarelo },
  filtroBtnTxt: { fontSize: 13, color: C.textoSec, fontWeight: '600' },
  filtroBtnTxtAtivo: { color: C.preto },
  filtroBadge: {
    backgroundColor: C.preto,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filtroBadgeTxt: { color: C.branco, fontSize: 10, fontWeight: '800' },

  filtrosAtivosWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  filtrosAtivosTxt: { fontSize: 12, color: C.textoSec },
  filtrosLimpar: { fontSize: 12, color: C.perigo, fontWeight: '700' },

  categoriasScroll: { marginTop: 10, flexGrow: 0, height: 52 },
  categoriasContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center', flexGrow: 1 },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.branco,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    flexShrink: 0,
  },
  catBtnAtivo: { backgroundColor: C.amarelo, borderColor: C.amarelo },
  catBtnPromo: { borderColor: C.perigo },
  catBtnPromoAtivo: { backgroundColor: C.perigo, borderColor: C.perigo },
  catBtnTxt: { fontSize: 13, color: C.textoSec, fontWeight: '500' },
  catBtnTxtAtivo: { color: C.preto, fontWeight: '700' },

  lista: { padding: 10 },
  row: { gap: 10, marginBottom: 10 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: C.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    padding: 10,
    overflow: 'hidden',
  },
  cardEsgotado: { opacity: 0.85 },
  cardImg: { width: '100%', height: 120, borderRadius: 8 },
  cardImgPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: C.cinzaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEsgotado: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#666',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeEsgotadoTxt: { color: C.branco, fontSize: 9, fontWeight: '800' },
  badgePromocao: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: C.perigo,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgePromocaoTxt: { color: C.branco, fontSize: 9, fontWeight: '800' },
  cardNome: { fontSize: 13, fontWeight: '600', color: C.preto, marginTop: 8, lineHeight: 18 },
  cardMarca: { fontSize: 11, color: C.textoSec, marginTop: 2 },
  cardPreco: { fontSize: 15, fontWeight: '800', color: C.amareloDark, marginTop: 4 },
  cardPrecoOriginal: { fontSize: 11, color: C.textoSec, textDecorationLine: 'line-through', marginTop: 4 },
  vazio: { textAlign: 'center', marginTop: 60, color: C.textoSec, fontSize: 15 },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: C.branco,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cinzaBorda,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: C.preto },
  modalLimpar: { fontSize: 14, color: C.perigo, fontWeight: '600' },
  modalScroll: { paddingHorizontal: 20 },

  secaoTitulo: { fontSize: 14, fontWeight: '700', color: C.preto, marginTop: 20, marginBottom: 10 },

  precoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  precoInput: {
    flex: 1,
    backgroundColor: C.cinzaClaro,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cinzaBorda,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.preto,
  },
  precoSep: { fontSize: 16, color: C.textoSec, fontWeight: '500' },

  marcaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.cinzaBorda,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.branco,
  },
  checkboxAtivo: { backgroundColor: C.amarelo, borderColor: C.amarelo },
  checkboxCheck: { fontSize: 13, fontWeight: '800', color: C.preto },
  marcaNome: { fontSize: 15, color: C.preto },

  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.cinzaBorda,
  },
  aplicarBtn: {
    backgroundColor: C.amarelo,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  aplicarBtnTxt: { fontSize: 16, fontWeight: '800', color: C.preto },
});
