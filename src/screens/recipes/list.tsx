import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { SearchField } from '@/components/search-field';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { usePreferences } from '@/context/preferences-context';
import { recipeMatchesQuery } from '@/utils/filter';
import { getScreenMetrics } from '@/utils/layout';
import type { Recipe } from '@/types';

type Props = {
  mode: 'all' | 'mine';
};

export function RecipesListScreen({ mode }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { recipes, groups, isLoading, refresh, getAuthorName } = useData();
  const { isFavorite, toggleFavorite } = usePreferences();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics();

  const [query, setQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string | 'all' | 'favorites'>('all');

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const data = useMemo(() => {
    const safeRecipes = Array.isArray(recipes) ? recipes : [];
    let list =
      mode === 'mine'
        ? safeRecipes.filter((recipe) => recipe?.authorId === user?.id)
        : safeRecipes.filter((recipe) => Boolean(recipe?.id && recipe?.title));

    if (mode === 'all' && groupFilter === 'favorites' && user?.id) {
      list = list.filter((recipe) => isFavorite(user.id, recipe.id));
    } else if (mode === 'all' && groupFilter !== 'all') {
      list = list.filter((recipe) => (recipe.groupIds ?? []).includes(groupFilter));
    }

    if (mode === 'mine' && groupFilter === 'favorites' && user?.id) {
      list = list.filter((recipe) => isFavorite(user.id, recipe.id));
    }

    return list.filter((recipe) => recipeMatchesQuery(recipe, query));
  }, [mode, recipes, user?.id, groupFilter, query, isFavorite]);

  const renderItem = ({ item }: { item: Recipe }) => {
    const isMine = item.authorId === user?.id;
    const groupsCount = item.groupIds?.length ?? 0;
    const authorLabel = getAuthorName(item.authorId);
    const favorite = user ? isFavorite(user.id, item.id) : false;

    return (
      <Pressable
        onPress={() => router.push(`/(app)/recipe/${item.id}` as Href)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.cardRow}>
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, { backgroundColor: colors.tintSoft }]}>
              <FontAwesome name="cutlery" size={20} color={colors.tint} />
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.cardTitle, { color: colors.text, flex: 1 }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {user ? (
                <Pressable
                  onPress={() => {
                    void toggleFavorite(user.id, item.id);
                  }}
                  hitSlop={8}
                >
                  <FontAwesome
                    name={favorite ? 'heart' : 'heart-o'}
                    size={18}
                    color={favorite ? colors.danger : colors.muted}
                  />
                </Pressable>
              ) : null}
            </View>
            {item.description ? (
              <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text style={[styles.meta, { color: colors.muted }]}>
              {(item.ingredients?.length ?? 0)} ingredientes
              {groupsCount > 0 ? ` · ${groupsCount} grupos` : ''}
              {mode === 'all' ? ` · ${isMine ? 'Tuya' : `De ${authorLabel}`}` : ''}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.heroFrom, colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: metrics.horizontalPadding,
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 12,
          },
        ]}
      >
        <Text style={[styles.eyebrow, { color: colors.tint }]}>Recetario</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'mine' ? 'Mis recetas' : 'Recetas'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {mode === 'mine'
            ? 'Solo las que has creado, ordenadas A-Z'
            : 'Todas las del dispositivo, ordenadas A-Z'}
        </Text>

        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por título, ingrediente o paso"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'favorites', label: 'Favoritas' },
              ...groups.map((group) => ({ id: group.id, label: group.name })),
            ].map((chip) => {
              const selected = groupFilter === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => setGroupFilter(chip.id as typeof groupFilter)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.tint : colors.tintSoft,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? colors.onTint : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={[styles.count, { color: colors.muted }]}>
          {data.length} {data.length === 1 ? 'receta' : 'recetas'}
        </Text>
        <UiButton
          label="Nueva receta"
          onPress={() => router.push('/(app)/recipe/new' as Href)}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.tint} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: metrics.horizontalPadding,
            paddingBottom: Math.max(insets.bottom, 24),
            gap: 12,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              title={mode === 'mine' ? 'Sin resultados' : 'Sin resultados'}
              description={
                query || groupFilter !== 'all'
                  ? 'Prueba otro término o quita el filtro.'
                  : mode === 'mine'
                    ? 'Crea una receta y aparecerá aquí.'
                    : 'Crea la primera receta o explora las de demostración.'
              }
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: 12 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, lineHeight: 21 },
  count: { fontSize: 13, fontWeight: '700' },
  loader: { marginTop: 40 },
  filters: { maxHeight: 42 },
  filterRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  card: {
    borderRadius: 18,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardDesc: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12, marginTop: 2, fontWeight: '600' },
});
