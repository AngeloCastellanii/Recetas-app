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
    title: 'Bienvenido a Recetario',
    body: 'Guarda tus recetas, organízalas en grupos y consulta las de todos en un solo lugar.',
  },
  {
    title: 'Organiza a tu manera',
    body: 'Crea grupos, marca favoritos, agrega fotos y filtra por lo que necesites cocinar hoy.',
  },
  {
    title: 'Listo para empezar',
    body: 'Incluye datos de demostración para explorar la app. Luego crea tu cuenta y tus propias recetas.',
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
        <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
        <Text style={[styles.body, { color: colors.muted }]}>{slide.body}</Text>
        <Text style={[styles.progress, { color: colors.muted }]}>
          {index + 1} / {SLIDES.length}
        </Text>
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
  block: { gap: 12 },
  brand: {
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  progress: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  actions: { gap: 10 },
});
