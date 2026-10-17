import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { getScreenMetrics, keyboardBehavior } from '@/utils/layout';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  centered?: boolean;
  /** Use false inside tab screens that already show a native header. */
  includeTopSafeArea?: boolean;
  gradient?: boolean;
};

export function Screen({
  children,
  scroll = true,
  contentStyle,
  centered = false,
  includeTopSafeArea = true,
  gradient = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const metrics = getScreenMetrics();

  const padding = {
    paddingTop: includeTopSafeArea ? Math.max(insets.top, 12) : 12,
    paddingBottom: Math.max(insets.bottom, 20),
    paddingHorizontal: metrics.horizontalPadding,
  };

  const body = (
    <View
      style={[
        styles.inner,
        metrics.contentMaxWidth
          ? { width: '100%', maxWidth: metrics.contentMaxWidth, alignSelf: 'center' }
          : null,
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  const content = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
      contentContainerStyle={[
        styles.scrollContent,
        padding,
        centered && styles.centered,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {body}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding]}>{body}</View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={keyboardBehavior}
    >
      {gradient ? (
        <LinearGradient
          colors={[colors.heroFrom, colors.background]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 0.55 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
  centered: {
    justifyContent: 'center',
  },
  inner: {
    width: '100%',
    gap: 22,
  },
});
