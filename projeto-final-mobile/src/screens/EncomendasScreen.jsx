import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../config';
import { C } from '../theme';
import { useApp } from '../AppContext';

const COR_ESTADO = {
  pendente:   { bg: '#FFF3CD', txt: '#856404' },
  processado: { bg: '#CCE5FF', txt: '#004085' },
  enviado:    { bg: '#D4EDDA', txt: '#155724' },
  entregue:   { bg: '#D1ECF1', txt: '#0C5460' },
  cancelado:  { bg: '#F8D7DA', txt: '#721C24' },
};

export default function EncomendasScreen() {
  const { token } = useApp();
  const [encomendas, setEncomendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [aberta, setAberta] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setErro(false);
      axios.get(`${API_URL}/api/encomendas`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => setEncomendas(res.data))
        .catch(() => setErro(true))
        .finally(() => setLoading(false));
    }, [token])
  );

  if (loading) return <ActivityIndicator size="large" color={C.amarelo} style={{ marginTop: 60 }} />;

  if (erro) return (
    <View style={s.centrado}>
      <Text style={s.erroTxt}>Erro ao carregar encomendas.</Text>
    </View>
  );

  if (encomendas.length === 0) return (
    <View style={s.centrado}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
      <Text style={s.semTxt}>Ainda não fizeste nenhuma encomenda.</Text>
    </View>
  );

  const renderEncomenda = ({ item }) => {
    const corEstado = COR_ESTADO[item.estado] || COR_ESTADO.pendente;
    const expandida = aberta === item.id;
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => setAberta(expandida ? null : item.id)}
        activeOpacity={0.9}
      >
        <View style={s.cardHeader}>
          <View>
            <Text style={s.cardId}>Encomenda #{item.id}</Text>
            <Text style={s.cardData}>{item.dataCriacao}</Text>
          </View>
          <View style={s.cardDireita}>
            <View style={[s.badge, { backgroundColor: corEstado.bg }]}>
              <Text style={[s.badgeTxt, { color: corEstado.txt }]}>{item.estado}</Text>
            </View>
            <Text style={s.cardTotal}>{Number(item.total).toFixed(2)} €</Text>
            <Text style={s.seta}>{expandida ? '▲' : '▼'}</Text>
          </View>
        </View>

        {expandida && (
          <View style={s.detalhe}>
            <Text style={s.entregaTxt}>
              📍 {item.moradaEntrega}, {item.codigoPostal}{item.cidade ? ` ${item.cidade}` : ''}
            </Text>
            {item.notas ? <Text style={s.notasTxt}>"{item.notas}"</Text> : null}

            {item.items?.map((i, idx) => (
              <View key={idx} style={s.itemLinha}>
                <Text style={s.itemNome} numberOfLines={1}>{i.nomeProduto}</Text>
                <Text style={s.itemInfo}>{i.quantidade}× {Number(i.precoUnitario).toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={encomendas}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderEncomenda}
      contentContainerStyle={s.lista}
      style={{ backgroundColor: C.cinzaClaro }}
    />
  );
}

const s = StyleSheet.create({
  lista: { padding: 12 },
  card: {
    backgroundColor: C.branco, borderRadius: 14,
    borderWidth: 1, borderColor: C.cinzaBorda,
    marginBottom: 10, padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardId: { fontSize: 14, fontWeight: '700', color: C.preto },
  cardData: { fontSize: 12, color: C.textoSec, marginTop: 2 },
  cardDireita: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt: { fontSize: 11, fontWeight: '700' },
  cardTotal: { fontSize: 15, fontWeight: '800', color: C.amareloDark },
  seta: { fontSize: 12, color: C.textoSec },
  detalhe: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.cinzaBorda, paddingTop: 12 },
  entregaTxt: { fontSize: 13, color: C.textoSec, marginBottom: 4 },
  notasTxt: { fontSize: 12, color: C.textoSec, fontStyle: 'italic', marginBottom: 8 },
  itemLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemNome: { flex: 1, fontSize: 13, color: C.preto, marginRight: 8 },
  itemInfo: { fontSize: 13, color: C.textoSec },
  centrado: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.cinzaClaro },
  erroTxt: { fontSize: 15, color: C.perigo },
  semTxt: { fontSize: 15, color: C.textoSec },
});
