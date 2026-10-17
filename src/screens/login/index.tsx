import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
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
        <Text
          style={[
            styles.brand,
            {
              color: colors.tint,
              fontSize: scaledFont(metrics.isCompact ? 30 : 36, metrics.scale),
            },
          ]}
        >
          Recetario
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Inicia sesión para gestionar tus recetas
        </Text>
      </View>

      <View style={styles.form}>
        <UiTextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          maxLength={LIMITS.email.max}
          placeholder="tu@correo.com"
        />
        <UiTextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
          maxLength={LIMITS.password.max}
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
  header: { gap: 8 },
  brand: {
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  form: { gap: 14 },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 15,
  },
});
