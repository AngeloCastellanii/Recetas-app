import { StyleSheet, Text, View } from 'react-native';

import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Perfil</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Sesión activa en este dispositivo
        </Text>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.muted }]}>Nombre</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {user?.name ?? '—'}
        </Text>

        <Text style={[styles.label, { color: colors.muted }]}>Correo</Text>
        <Text style={[styles.value, { color: colors.text }]}>
          {user?.email ?? '—'}
        </Text>
      </View>

      <UiButton label="Cerrar sesión" variant="secondary" onPress={() => logout()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  header: { gap: 6 },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    fontSize: 17,
    fontWeight: '600',
  },
});
