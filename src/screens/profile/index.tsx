import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/context/auth-context';
import { usePreferences } from '@/context/preferences-context';
import { getScreenMetrics, scaledFont } from '@/utils/layout';
import type { ThemePreference } from '@/types';

const THEME_OPTIONS: { id: ThemePreference; label: string }[] = [
  { id: 'dark', label: 'Oscuro' },
  { id: 'light', label: 'Claro' },
];

export function ProfileScreen() {
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const { preferences, setTheme } = usePreferences();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const metrics = getScreenMetrics();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
  }, [user?.id, user?.name, user?.email]);

  const onSave = async () => {
    setError(null);
    setSuccess(null);

    if (password.length > 0 && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        name,
        email,
        password: password.length > 0 ? password : undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setPassword('');
      setConfirmPassword('');
      setSuccess('Perfil actualizado correctamente.');
    } finally {
      setSaving(false);
    }
  };

  const onDeletePress = () => {
    Alert.alert(
      'Borrar cuenta',
      'Se eliminarán tu cuenta, tus recetas y tus grupos. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void confirmDelete();
          },
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setError(null);
    setSuccess(null);
    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  const onLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <Screen includeTopSafeArea={false}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: scaledFont(metrics.isCompact ? 24 : 28, metrics.scale),
            },
          ]}
        >
          Perfil
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Edita tus datos, el tema o elimina tu cuenta
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.section, { color: colors.text }]}>Apariencia</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const selected = preferences.theme === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => {
                  void setTheme(option.id);
                }}
                style={[
                  styles.themeChip,
                  {
                    borderColor: selected ? colors.tint : colors.border,
                    backgroundColor: selected ? colors.tint : colors.tintSoft,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.onTint : colors.text,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <UiTextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
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
          helperText="Debe incluir @ y terminar en .com"
        />
        <UiTextField
          label="Nueva contraseña (opcional)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
          helperText={`Déjala vacía para no cambiarla. Mínimo ${LIMITS.password.min} caracteres.`}
        />
        <UiTextField
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="password-new"
        />

        {error ? (
          <Text style={[styles.message, { color: colors.danger }]}>{error}</Text>
        ) : null}
        {success ? (
          <Text style={[styles.message, { color: colors.tint }]}>{success}</Text>
        ) : null}

        <UiButton label="Guardar cambios" onPress={onSave} loading={saving} />
        <UiButton label="Cerrar sesión" variant="secondary" onPress={onLogout} />
        <UiButton
          label="Borrar cuenta"
          variant="danger"
          loading={deleting}
          onPress={onDeletePress}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  title: { fontWeight: '800' },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  section: { fontSize: 16, fontWeight: '700' },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  message: { fontSize: 14, fontWeight: '600' },
});
