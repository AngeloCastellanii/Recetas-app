import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { asRouteId } from '@/utils/params';

export function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const groupId = asRouteId(id);
  const { user } = useAuth();
  const {
    getGroupById,
    getRecipesForGroup,
    deleteGroup,
    unlinkRecipeFromGroup,
    refresh,
  } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const group = groupId ? getGroupById(groupId) : undefined;
  const recipes = groupId ? getRecipesForGroup(groupId) : [];
  const isOwner = Boolean(group && user && group.ownerId === user.id);

  const onDelete = () => {
    Alert.alert(
      'Borrar grupo',
      'Las recetas se desvincularán de este grupo, pero no se eliminarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await deleteGroup(groupId);
              if (!result.ok) {
                Alert.alert('Error', result.error);
                return;
              }
              router.replace('/(app)/(tabs)/groups');
            })();
          },
        },
      ]
    );
  };

  const onUnlink = (recipeId: string, title: string) => {
    Alert.alert(
      'Quitar del grupo',
      `"${title}" saldrá de este grupo, pero la receta seguirá existiendo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await unlinkRecipeFromGroup(groupId, recipeId);
              if (!result.ok) {
                Alert.alert('Error', result.error);
              }
            })();
          },
        },
      ]
    );
  };

  if (!group) {
    return (
      <Screen includeTopSafeArea={false}>
        <Text style={{ color: colors.danger }}>Grupo no encontrado.</Text>
        <UiButton
          label="Volver a grupos"
          variant="secondary"
          onPress={() => router.replace('/(app)/(tabs)/groups')}
        />
      </Screen>
    );
  }

  return (
    <Screen includeTopSafeArea={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{group.name}</Text>
        {group.description ? (
          <Text style={[styles.description, { color: colors.muted }]}>
            {group.description}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.muted }]}>
          {recipes.length} {recipes.length === 1 ? 'receta' : 'recetas'}
        </Text>
      </View>

      {isOwner ? (
        <View style={styles.actions}>
          <UiButton
            label="Editar"
            variant="secondary"
            onPress={() => router.push(`/(app)/group/edit/${group.id}` as Href)}
          />
          <UiButton label="Borrar grupo" variant="danger" onPress={onDelete} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recetas</Text>
        {recipes.length === 0 ? (
          <EmptyState
            title="Sin recetas asociadas"
            description="Cuando agregues recetas a este grupo, aparecerán aquí."
          />
        ) : (
          <View style={styles.list}>
            {recipes.map((recipe) => (
              <View
                key={recipe.id}
                style={[
                  styles.recipeRow,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <Pressable
                  style={styles.recipeInfo}
                  onPress={() => router.push(`/(app)/recipe/${recipe.id}` as Href)}
                >
                  <Text
                    style={[styles.recipeTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {recipe.title}
                  </Text>
                </Pressable>
                {isOwner ? (
                  <Pressable onPress={() => onUnlink(recipe.id, recipe.title)}>
                    <Text style={{ color: colors.danger, fontWeight: '700' }}>
                      Quitar
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
  },
  meta: {
    fontSize: 13,
  },
  actions: { gap: 10 },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  list: { gap: 10 },
  recipeRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});
