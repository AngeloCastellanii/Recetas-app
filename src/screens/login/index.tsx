import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { getScreenMetrics, scaledFont } from '@/utils/layout';

export function LoginScreen() {
  const { login } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const metrics = getScreenMetrics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await login({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/(app)/(tabs)/recipes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen centered>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
          <FontAwesome name="cutlery" size={28} color={colors.tint} />
        </View>
        <Text
          style={[
            styles.brand,
            {
              color: colors.text,
              fontSize: scaledFont(metrics.isCompact ? 34 : 40, metrics.scale),
            },
          ]}
        >
          Recetario
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Cocina, organiza y guarda tus ideas en un solo lugar
        </Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <UiTextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder="tu@correo.com"
          helperText="Debe incluir @ y terminar en .com"
        />
        <UiTextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          placeholder="••••••••"
        />

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <UiButton label="Entrar" onPress={onSubmit} loading={loading} />
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>
        ¿No tienes cuenta?{' '}
        <Link href="/(auth)/register" style={{ color: colors.tint, fontWeight: '700' }}>
          Regístrate
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, alignItems: 'flex-start' },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brand: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
  },
  formCard: {
    gap: 14,
    borderRadius: 24,
    padding: 18,
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 15,
  },
});
