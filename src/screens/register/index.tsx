import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/context/auth-context';
import { getScreenMetrics, scaledFont } from '@/utils/layout';

export function RegisterScreen() {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const metrics = getScreenMetrics();
  const submitting = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (submitting.current || loading) {
      return;
    }
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    submitting.current = true;
    setLoading(true);
    try {
      const result = await register({ name, email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/(app)/(tabs)/recipes');
    } catch {
      setError('No se pudo registrar. Inténtalo de nuevo en unos segundos.');
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  };

  return (
    <Screen centered>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: colors.tintSoft }]}>
          <FontAwesome name="user-plus" size={24} color={colors.tint} />
        </View>
        <Text
          style={[
            styles.brand,
            {
              color: colors.text,
              fontSize: scaledFont(metrics.isCompact ? 30 : 34, metrics.scale),
            },
          ]}
        >
          Crear cuenta
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Guarda tus recetas y organízalas en grupos
        </Text>
      </View>

      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        <UiTextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Tu nombre"
        />
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
          helperText="Ej: nombre@correo.com, usuario@empresa.net"
        />
        <UiTextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          helperText={`Mínimo ${LIMITS.password.min} caracteres`}
          placeholder="••••••••"
        />
        <UiTextField
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          placeholder="••••••••"
        />

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <UiButton label="Registrarme" onPress={onSubmit} loading={loading} />
      </View>

      <Text style={[styles.footer, { color: colors.muted }]}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/(auth)/login" style={{ color: colors.tint, fontWeight: '700' }}>
          Inicia sesión
        </Link>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  brand: {
    fontWeight: '800',
    letterSpacing: -0.4,
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
