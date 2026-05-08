import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from './src/AppContext';
import { C } from './src/theme';

import CatalogoScreen  from './src/screens/CatalogoScreen';
import ProdutoScreen   from './src/screens/ProdutoScreen';
import CarrinhoScreen  from './src/screens/CarrinhoScreen';
import CheckoutScreen  from './src/screens/CheckoutScreen';
import ContaScreen     from './src/screens/ContaScreen';
import LoginScreen     from './src/screens/LoginScreen';
import RegisterScreen  from './src/screens/RegisterScreen';
import EncomendasScreen from './src/screens/EncomendasScreen';
import PerfilScreen     from './src/screens/PerfilScreen';
import SegurancaScreen  from './src/screens/SegurancaScreen';

const LojaStack    = createNativeStackNavigator();
const CarrinhoStack = createNativeStackNavigator();
const ContaStack   = createNativeStackNavigator();
const Tab          = createBottomTabNavigator();

function LojaNavigator() {
  return (
    <LojaStack.Navigator screenOptions={headerOpts}>
      <LojaStack.Screen name="CatalogoLista" component={CatalogoScreen} options={{ title: '♪ SoundStore' }} />
      <LojaStack.Screen name="Produto" component={ProdutoScreen} options={{ title: 'Produto' }} />
    </LojaStack.Navigator>
  );
}

function CarrinhoNavigator() {
  return (
    <CarrinhoStack.Navigator screenOptions={headerOpts}>
      <CarrinhoStack.Screen name="CarrinhoLista" component={CarrinhoScreen} options={{ title: 'Carrinho' }} />
      <CarrinhoStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Finalizar encomenda' }} />
    </CarrinhoStack.Navigator>
  );
}

function ContaNavigator() {
  return (
    <ContaStack.Navigator screenOptions={headerOpts}>
      <ContaStack.Screen name="ContaMain" component={ContaScreen} options={{ title: 'Minha conta' }} />
      <ContaStack.Screen name="Login" component={LoginScreen} options={{ title: 'Entrar' }} />
      <ContaStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Criar conta' }} />
      <ContaStack.Screen name="Encomendas" component={EncomendasScreen} options={{ title: 'Encomendas' }} />
      <ContaStack.Screen name="Perfil"     component={PerfilScreen}     options={{ title: 'Perfil' }} />
      <ContaStack.Screen name="Seguranca"  component={SegurancaScreen}  options={{ title: 'Segurança' }} />
    </ContaStack.Navigator>
  );
}

function MainTabs() {
  const { totalItens } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: C.amareloDark,
        tabBarInactiveTintColor: C.textoSec,
        tabBarStyle: { borderTopColor: C.cinzaBorda },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            LojaTab:    focused ? 'storefront'       : 'storefront-outline',
            CarrinhoTab: focused ? 'cart'              : 'cart-outline',
            ContaTab:   focused ? 'person'            : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="LojaTab"     component={LojaNavigator}     options={{ title: 'Loja' }} />
      <Tab.Screen
        name="CarrinhoTab"
        component={CarrinhoNavigator}
        options={{ title: 'Carrinho', tabBarBadge: totalItens > 0 ? totalItens : undefined }}
      />
      <Tab.Screen name="ContaTab"    component={ContaNavigator}    options={{ title: 'Conta' }} />
    </Tab.Navigator>
  );
}

function AppInner() {
  const { carregando } = useApp();
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.branco }}>
        <ActivityIndicator size="large" color={C.amarelo} />
      </View>
    );
  }
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppInner />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const headerOpts = {
  headerStyle: { backgroundColor: C.branco },
  headerTintColor: C.preto,
  headerTitleStyle: { fontWeight: '800' },
  headerShadowVisible: false,
};
