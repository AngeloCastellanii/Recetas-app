import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';

export function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = typeof id === 'string' ? id : '';
  const { user } = useAuth();
  const { getRecipeById, getGroupsForRecipe, deleteRecipe, refresh } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const recipe = getRecipeById(recipeId);
  const linkedGroups = getGroupsForRecipe(recipeId);
  const isOwner = Boolean(recipe && user && recipe.authorId === user.id);

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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>
        {recipe.description ? (
          <Text style={[styles.description, { color: colors.muted }]}>
            {recipe.description}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.muted }]}>
          {recipe.prepTimeMinutes != null ? `${recipe.prepTimeMinutes} min` : 'Sin tiempo'}
          {' · '}
          {recipe.servings != null
            ? `${recipe.servings} porciones`
            : 'Sin porciones'}
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
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Grupos</Text>
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
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
  },
});
