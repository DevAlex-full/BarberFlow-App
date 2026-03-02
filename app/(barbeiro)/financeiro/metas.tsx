import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
export default function MetasScreen() {
  return <View style={s.c}><Text style={s.t}>Metas — Em breve (Fase 3)</Text></View>;
}
const s = StyleSheet.create({ c:{flex:1,alignItems:'center',justifyContent:'center'}, t:{color:Colors.textSecondary,fontSize:16} });