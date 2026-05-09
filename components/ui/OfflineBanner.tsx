import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { BodySmall } from './Typography';

interface OfflineBannerProps {
  visible: boolean;
}

export function OfflineBanner({ visible }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(48 + insets.top))).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -(48 + insets.top),
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible, insets.top]);

  return (
    <Animated.View
      style={[
        styles.banner,
        { paddingTop: insets.top + Spacing[1], transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="cloud-offline-outline" size={15} color={Colors.textInverse} />
      <BodySmall color={Colors.textInverse} style={styles.text}>
        No connection — server actions may not work
      </BodySmall>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing[2],
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  text: {
    textAlign: 'center',
  },
});
