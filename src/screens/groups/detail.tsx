import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
    recipes: allRecipes,
    getGroupById,
    getRecipesForGroup,
    deleteGroup,
    unlinkRecipeFromGroup,
    toggleRecipeInGroup,
    refresh,
  } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [showAddList, setShowAddList] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const group = groupId ? getGroupById(groupId) : undefined;
  const recipes = groupId ? getRecipesForGroup(groupId) : [];
  const isOwner = Boolean(group && user && group.ownerId === user.id);

  const availableRecipes = useMemo(() => {
    const linked = new Set(group?.recipeIds ?? []);
    return allRecipes.filter((recipe) => recipe?.id && !linked.has(recipe.id));
  }, [allRecipes, group?.recipeIds]);

  const onDelete = () => {
    Alert.alert(
      'Borrar grupo',
      'Se eliminará el grupo y también todas las recetas que tenga asociadas.',
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

  const onAddRecipe = async (recipeId: string) => {
    setAddingId(recipeId);
    try {
      const result = await toggleRecipeInGroup(recipeId, groupId);
      if (!result.ok) {
        Alert.alert('Error', result.error);
        return;
      }
      if (availableRecipes.length <= 1) {
        setShowAddList(false);
      }
    } finally {
      setAddingId(null);
    }
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
            label={showAddList ? 'Ocultar lista' : 'Agregar recetas al grupo'}
            variant="secondary"
            onPress={() => setShowAddList((value) => !value)}
          />
          <UiButton
            label="Editar"
            variant="secondary"
            onPress={() => router.push(`/(app)/group/edit/${group.id}` as Href)}
          />
          <UiButton label="Borrar grupo" variant="danger" onPress={onDelete} />
        </View>
      ) : null}

      {isOwner && showAddList ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recetas disponibles
          </Text>
          {availableRecipes.length === 0 ? (
            <Text style={{ color: colors.muted }}>
              No hay más recetas para agregar. Crea nuevas en Recetas.
            </Text>
          ) : (
            <View style={styles.list}>
              {availableRecipes.map((recipe) => (
                <View
                  key={recipe.id}
                  style={[
                    styles.recipeRow,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                >
                  <Text
                    style={[styles.recipeTitle, { color: colors.text, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {recipe.title}
                  </Text>
                  <Pressable
                    disabled={addingId === recipe.id}
                    onPress={() => {
                      void onAddRecipe(recipe.id);
                    }}
                  >
                    <Text style={{ color: colors.tint, fontWeight: '700' }}>
                      {addingId === recipe.id ? '...' : 'Agregar'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recetas del grupo
        </Text>
        {recipes.length === 0 ? (
          <EmptyState
            title="Sin recetas asociadas"
            description="Usa Agregar recetas al grupo para incluir recetas ya creadas."
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
  title: { fontSize: 28, fontWeight: '800' },
  description: { fontSize: 15, lineHeight: 21 },
  meta: { fontSize: 13 },
  actions: { gap: 10 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  list: { gap: 10 },
  recipeRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recipeInfo: { flex: 1 },
  recipeTitle: { fontSize: 16, fontWeight: '600' },
});
