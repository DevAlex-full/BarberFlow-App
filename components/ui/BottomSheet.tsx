import { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  StyleSheet, TouchableWithoutFeedback, Dimensions,
  ScrollView,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapHeight?: number;
}

export function BottomSheet({ visible, onClose, title, children, snapHeight = SCREEN_HEIGHT * 0.5 }: BottomSheetProps) {
  const anim = useRef(new Animated.Value(snapHeight)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 0 : snapHeight,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { height: snapHeight, transform: [{ translateY: anim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        {!!title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
  },
  handle: {
    width: 40, height: 4, backgroundColor: Colors.gray[300],
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:    { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 16, color: Colors.gray[500] },
  content:  { padding: Spacing.md, paddingBottom: 40 },
});