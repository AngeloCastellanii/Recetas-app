import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
import { useData } from '@/context/data-context';

type Props = {
  mode: 'create' | 'edit';
};

export function GroupFormScreen({ mode }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { createGroup, updateGroup, getGroupById } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const groupId = typeof params.id === 'string' ? params.id : undefined;
  const existing = useMemo(
    () => (groupId ? getGroupById(groupId) : undefined),
    [groupId, getGroupById]
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setDescription(existing.description);
    }
  }, [existing?.id, existing?.name, existing?.description]);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'create') {
        const result = await createGroup({ name, description });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace(`/(app)/group/${result.group.id}`);
        return;
      }

      if (!groupId) {
        setError('Grupo no encontrado.');
        return;
      }

      const result = await updateGroup({ id: groupId, name, description });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'edit' && groupId && !existing) {
    return (
      <Screen includeTopSafeArea={false}>
        <Text style={{ color: colors.danger }}>Grupo no encontrado.</Text>
        <UiButton label="Volver" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen includeTopSafeArea={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'create' ? 'Nuevo grupo' : 'Editar grupo'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Define un nombre y una descripción breve
        </Text>
      </View>

      <View style={styles.form}>
        <UiTextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.groupName.max}
          helperText={`${name.length}/${LIMITS.groupName.max}`}
          placeholder="Ej. Cenas rápidas"
        />
        <UiTextField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          maxLength={LIMITS.groupDescription.max}
          helperText={`${description.length}/${LIMITS.groupDescription.max}`}
          placeholder="Opcional"
          multiline
          style={styles.multiline}
        />

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <UiButton
          label={mode === 'create' ? 'Crear grupo' : 'Guardar cambios'}
          onPress={onSubmit}
          loading={loading}
        />
        <UiButton label="Cancelar" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  form: { gap: 14 },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 14,
    fontWeight: '600',
  },
});
