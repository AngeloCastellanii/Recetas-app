import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { usePreferences } from '@/context/preferences-context';
import { asRouteId } from '@/utils/params';

export function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = asRouteId(id);
  const { user } = useAuth();
  const {
    groups,
    getRecipeById,
    getGroupsForRecipe,
    getAuthorName,
    deleteRecipe,
    toggleRecipeInGroup,
    refresh,
  } = useData();
  const { isFavorite, toggleFavorite } = usePreferences();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const recipe = recipeId ? getRecipeById(recipeId) : undefined;
  const linkedGroups = recipeId ? getGroupsForRecipe(recipeId) : [];
  const isOwner = Boolean(recipe && user && recipe.authorId === user.id);
  const favorite = Boolean(user && recipe && isFavorite(user.id, recipe.id));

  const myGroups = useMemo(
    () => groups.filter((group) => group.ownerId === user?.id),
    [groups, user?.id]
  );

  const onDelete = () => {
    Alert.alert(
      'Borrar receta',
      'Esta acción eliminará la receta. Si está en grupos, solo se desvinculará de ellos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const result = await deleteRecipe(recipeId);
              if (!result.ok) {
                Alert.alert('Error', result.error);
                return;
              }
              router.replace('/(app)/(tabs)/recipes');
            })();
          },
        },
      ]
    );
  };

  const onToggleGroup = async (groupId: string) => {
    setSavingGroupId(groupId);
    try {
      const result = await toggleRecipeInGroup(recipeId, groupId);
      if (!result.ok) {
        Alert.alert('Error', result.error);
      }
    } finally {
      setSavingGroupId(null);
    }
  };

  if (!recipe) {
    return (
      <Screen includeTopSafeArea={false}>
        <Text style={{ color: colors.danger }}>Receta no encontrada.</Text>
        <UiButton
          label="Volver a recetas"
          variant="secondary"
          onPress={() => router.replace('/(app)/(tabs)/recipes')}
        />
      </Screen>
    );
  }

  return (
    <Screen includeTopSafeArea={false}>
      {recipe.imageUri ? (
        <Image source={{ uri: recipe.imageUri }} style={styles.hero} />
      ) : null}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text, flex: 1 }]}>{recipe.title}</Text>
          {user ? (
            <Pressable
              onPress={() => {
                void toggleFavorite(user.id, recipe.id);
              }}
              hitSlop={8}
            >
              <FontAwesome
                name={favorite ? 'heart' : 'heart-o'}
                size={22}
                color={favorite ? colors.danger : colors.muted}
              />
            </Pressable>
          ) : null}
        </View>
        {recipe.description ? (
          <Text style={[styles.description, { color: colors.muted }]}>
            {recipe.description}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.muted }]}>
          Autor: {getAuthorName(recipe.authorId)}
          {' · '}
          {recipe.prepTimeMinutes != null ? `${recipe.prepTimeMinutes} min` : 'Sin tiempo'}
          {' · '}
          {recipe.servings != null ? `${recipe.servings} porciones` : 'Sin porciones'}
        </Text>
      </View>

      {isOwner ? (
        <View style={styles.actions}>
          <UiButton
            label="Editar"
            variant="secondary"
            onPress={() => router.push(`/(app)/recipe/edit/${recipe.id}` as Href)}
          />
          <UiButton label="Borrar receta" variant="danger" onPress={onDelete} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Guardar en mis grupos
        </Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          Toca un grupo para agregarla o quitarla
        </Text>
        {myGroups.length === 0 ? (
          <Text style={{ color: colors.muted }}>
            Aún no tienes grupos. Créalos en la pestaña Grupos.
          </Text>
        ) : (
          <View style={styles.chips}>
            {myGroups.map((group) => {
              const selected = (recipe.groupIds ?? []).includes(group.id);
              const busy = savingGroupId === group.id;
              return (
                <Pressable
                  key={group.id}
                  disabled={busy}
                  onPress={() => {
                    void onToggleGroup(group.id);
                  }}
                  style={[
                    styles.chip,
                    {
                      opacity: busy ? 0.6 : 1,
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
                    {selected ? `En ${group.name}` : `Guardar en ${group.name}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredientes</Text>
        {(recipe.ingredients ?? []).map((item, index) => (
          <Text key={`ing-${index}`} style={[styles.item, { color: colors.text }]}>
            • {item}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pasos</Text>
        {(recipe.steps ?? []).map((item, index) => (
          <Text key={`step-${index}`} style={[styles.item, { color: colors.text }]}>
            {index + 1}. {item}
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Grupos actuales</Text>
        {linkedGroups.length === 0 ? (
          <Text style={{ color: colors.muted }}>Sin grupos asociados.</Text>
        ) : (
          linkedGroups.map((group) => (
            <Text key={group.id} style={[styles.item, { color: colors.text }]}>
              • {group.name}
            </Text>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 200, borderRadius: 16 },
  header: { gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 28, fontWeight: '800' },
  description: { fontSize: 15, lineHeight: 21 },
  meta: { fontSize: 13 },
  actions: { gap: 10 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 13 },
  item: { fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
