import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
export default function TransacoesScreen() {
  return <View style={s.c}><Text style={s.t}>Transações — Em breve (Fase 3)</Text></View>;
}
const s = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center' }, t: { color: Colors.textSecondary, fontSize:16 } });