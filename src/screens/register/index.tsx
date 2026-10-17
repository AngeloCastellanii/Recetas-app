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

export function RegisterScreen() {
  const { register } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const metrics = getScreenMetrics();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({ name, email, password });
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
              fontSize: scaledFont(metrics.isCompact ? 28 : 32, metrics.scale),
            },
          ]}
        >
          Crear cuenta
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Regístrate para guardar tus recetas y grupos
        </Text>
      </View>

      <View style={styles.form}>
        <UiTextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          maxLength={LIMITS.name.max}
          helperText={`${name.length}/${LIMITS.name.max}`}
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
          maxLength={LIMITS.email.max}
          placeholder="tu@correo.com"
        />
        <UiTextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          maxLength={LIMITS.password.max}
          helperText={`Entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres`}
          placeholder="••••••••"
        />
        <UiTextField
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          maxLength={LIMITS.password.max}
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
