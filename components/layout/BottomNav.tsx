import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/colors';

interface NavItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

interface BottomNavProps {
  items: NavItem[];
  activeRoute: string;
  onPress: (route: string) => void;
}

export function BottomNav({ items, activeRoute, onPress }: BottomNavProps) {
  return (
    <View style={styles.container}>
      {items.map(item => {
        const isActive = activeRoute === item.route;
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => onPress(item.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={24}
              color={isActive ? Colors.primary : Colors.gray[400]}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
    height: 60,
  },
  item:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label:        { fontSize: 10, fontWeight: '500', color: Colors.gray[400] },
  labelActive:  { color: Colors.primary, fontWeight: '700' },
});