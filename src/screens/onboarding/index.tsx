import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { usePreferences } from '@/context/preferences-context';

const SLIDES = [
  {
    icon: 'cutlery' as const,
    title: 'Bienvenido a Recetario',
    body: 'Guarda tus recetas, organízalas en grupos y consulta las de todos en un solo lugar.',
  },
  {
    icon: 'folder-open' as const,
    title: 'Organiza a tu manera',
    body: 'Crea grupos, marca favoritos, agrega fotos y filtra por lo que necesites cocinar hoy.',
  },
  {
    icon: 'heart' as const,
    title: 'Listo para empezar',
    body: 'Incluye recetas de cortesía para explorar la app. Luego crea tu cuenta y tus propias recetas.',
  },
];

export function OnboardingScreen() {
  const { completeOnboarding } = usePreferences();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const slide = SLIDES[index];

  const finish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen centered>
      <View style={styles.block}>
        <Text style={[styles.brand, { color: colors.tint }]}>Recetario</Text>
        <View style={[styles.iconWrap, { backgroundColor: colors.tintSoft }]}>
          <FontAwesome name={slide.icon} size={30} color={colors.tint} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{slide.body}</Text>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === index ? colors.tint : colors.border,
                  width: i === index ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {index < SLIDES.length - 1 ? (
          <UiButton label="Siguiente" onPress={() => setIndex((value) => value + 1)} />
        ) : (
          <UiButton label="Empezar" onPress={finish} loading={loading} />
        )}
        {index < SLIDES.length - 1 ? (
          <UiButton label="Saltar" variant="secondary" onPress={finish} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: 14 },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 8,
    borderRadius: 999,
  },
  actions: { gap: 10 },
});
