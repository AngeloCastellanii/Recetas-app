import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { UiButton } from '@/components/ui-button';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { getScreenMetrics } from '@/utils/layout';
import type { Recipe } from '@/types';

type Props = {
  mode: 'all' | 'mine';
};

export function RecipesListScreen({ mode }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { recipes, isLoading, refresh, getAuthorName } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const insets = useSafeAreaInsets();
  const metrics = getScreenMetrics();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const data = useMemo(() => {
    const safeRecipes = Array.isArray(recipes) ? recipes : [];
    if (mode === 'mine') {
      if (!user?.id) {
        return [];
      }
      return safeRecipes.filter((recipe) => recipe?.authorId === user.id);
    }
    return safeRecipes.filter((recipe) => Boolean(recipe?.id && recipe?.title));
  }, [mode, recipes, user?.id]);

  const renderItem = ({ item }: { item: Recipe }) => {
    const isMine = item.authorId === user?.id;
    const groupsCount = item.groupIds?.length ?? 0;
    const authorLabel = getAuthorName(item.authorId);

    return (
      <Pressable
        onPress={() => router.push(`/(app)/recipe/${item.id}` as Href)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
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
      </Pressable>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'mine' ? 'Mis recetas' : 'Recetas'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {mode === 'mine'
            ? 'Solo las recetas que has creado, en orden alfabético'
            : 'Todas las recetas del dispositivo, en orden alfabético'}
        </Text>
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
              title={mode === 'mine' ? 'Aún no tienes recetas' : 'Sin recetas'}
              description={
                mode === 'mine'
                  ? 'Crea una receta y aparecerá aquí. En Recetas verás también las de otros usuarios.'
                  : 'Crea la primera receta para empezar a llenar el recetario.'
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
  header: {
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
  },
  loader: { marginTop: 40 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
    marginTop: 4,
  },
});
