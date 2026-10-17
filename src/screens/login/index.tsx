import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/context/auth-context';

export function LoginScreen() {
  const { login } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

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
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.brand, { color: colors.tint }]}>Recetario</Text>
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
            maxLength={LIMITS.email.max}
            placeholder="tu@correo.com"
          />
          <UiTextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 28,
  },
  header: { gap: 8 },
  brand: {
    fontSize: 36,
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
