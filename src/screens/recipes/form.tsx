import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { UiButton } from '@/components/ui-button';
import { UiTextField } from '@/components/ui-text-field';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { asRouteId } from '@/utils/params';
import type { FieldErrors } from '@/types';

type Props = {
  mode: 'create' | 'edit';
};

export function RecipeFormScreen({ mode }: Props) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { createRecipe, updateRecipe, getRecipeById, groups } = useData();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const recipeId = asRouteId(params.id) || undefined;
  const existing = useMemo(
    () => (recipeId ? getRecipeById(recipeId) : undefined),
    [recipeId, getRecipeById]
  );
  const myGroups = useMemo(
    () => groups.filter((group) => group.ownerId === user?.id),
    [groups, user?.id]
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [ingredients, setIngredients] = useState<string[]>(
    existing?.ingredients?.length ? existing.ingredients : ['']
  );
  const [steps, setSteps] = useState<string[]>(
    existing?.steps?.length ? existing.steps : ['']
  );
  const [groupIds, setGroupIds] = useState<string[]>(existing?.groupIds ?? []);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    existing?.prepTimeMinutes != null ? String(existing.prepTimeMinutes) : ''
  );
  const [servings, setServings] = useState(
    existing?.servings != null ? String(existing.servings) : ''
  );
  const [imageUri, setImageUri] = useState<string | null>(existing?.imageUri ?? null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!existing) {
      return;
    }
    setTitle(existing.title);
    setDescription(existing.description);
    setIngredients(existing.ingredients?.length ? existing.ingredients : ['']);
    setSteps(existing.steps?.length ? existing.steps : ['']);
    setGroupIds(existing.groupIds ?? []);
    setPrepTimeMinutes(
      existing.prepTimeMinutes != null ? String(existing.prepTimeMinutes) : ''
    );
    setServings(existing.servings != null ? String(existing.servings) : '');
    setImageUri(existing.imageUri ?? null);
  }, [existing?.id]);

  const toggleGroup = (id: string) => {
    setGroupIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso para agregar una foto.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsEditing: true,
          aspect: [4, 3],
        });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = {
        title,
        description,
        ingredients,
        steps,
        groupIds,
        prepTimeMinutes,
        servings,
        imageUri,
      };

      if (mode === 'create') {
        const result = await createRecipe(payload);
        if (!result.ok) {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
          return;
        }
        router.replace(`/(app)/recipe/${result.recipe.id}` as Href);
        return;
      }

      if (!recipeId) {
        setError('Receta no encontrada.');
        return;
      }

      const result = await updateRecipe({ id: recipeId, ...payload });
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'edit' && recipeId && !existing) {
    return (
      <Screen includeTopSafeArea={false}>
        <Text style={{ color: colors.danger }}>Receta no encontrada.</Text>
        <UiButton label="Volver" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen includeTopSafeArea={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'create' ? 'Nueva receta' : 'Editar receta'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Completa los datos, ingredientes y pasos
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.section, { color: colors.text }]}>Foto</Text>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, { backgroundColor: colors.border }]} />
        )}
        <View style={styles.imageActions}>
          <UiButton label="Galería" variant="secondary" onPress={() => pickImage(false)} />
          <UiButton label="Cámara" variant="secondary" onPress={() => pickImage(true)} />
        </View>
        {imageUri ? (
          <UiButton label="Quitar foto" variant="danger" onPress={() => setImageUri(null)} />
        ) : null}

        <UiTextField
          label="Título"
          value={title}
          onChangeText={setTitle}
          maxLength={LIMITS.recipeTitle.max}
          helperText={`${title.length}/${LIMITS.recipeTitle.max}`}
          error={fieldErrors.title}
          placeholder="Ej. Pasta al pesto"
        />
        <UiTextField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          maxLength={LIMITS.recipeDescription.max}
          helperText={`${description.length}/${LIMITS.recipeDescription.max}`}
          error={fieldErrors.description}
          placeholder="Opcional"
          multiline
          style={styles.multiline}
        />
        <UiTextField
          label="Tiempo (minutos)"
          value={prepTimeMinutes}
          onChangeText={setPrepTimeMinutes}
          keyboardType="number-pad"
          maxLength={4}
          error={fieldErrors.prepTimeMinutes}
          placeholder="Opcional"
        />
        <UiTextField
          label="Porciones"
          value={servings}
          onChangeText={setServings}
          keyboardType="number-pad"
          maxLength={3}
          error={fieldErrors.servings}
          placeholder="Opcional"
        />

        <Text style={[styles.section, { color: colors.text }]}>Ingredientes</Text>
        {fieldErrors.ingredients ? (
          <Text style={{ color: colors.danger }}>{fieldErrors.ingredients}</Text>
        ) : null}
        {ingredients.map((item, index) => (
          <View key={`ingredient-${index}`} style={styles.row}>
            <View style={styles.rowField}>
              <UiTextField
                label={`Ingrediente ${index + 1}`}
                value={item}
                onChangeText={(text) => {
                  setIngredients((current) =>
                    current.map((value, i) => (i === index ? text : value))
                  );
                }}
                maxLength={LIMITS.ingredient.max}
              />
            </View>
            {ingredients.length > 1 ? (
              <Pressable
                onPress={() =>
                  setIngredients((current) => current.filter((_, i) => i !== index))
                }
                style={styles.removeBtn}
              >
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <UiButton
          label="Agregar ingrediente"
          variant="secondary"
          onPress={() => setIngredients((current) => [...current, ''])}
        />

        <Text style={[styles.section, { color: colors.text }]}>Pasos</Text>
        {fieldErrors.steps ? (
          <Text style={{ color: colors.danger }}>{fieldErrors.steps}</Text>
        ) : null}
        {steps.map((item, index) => (
          <View key={`step-${index}`} style={styles.row}>
            <View style={styles.rowField}>
              <UiTextField
                label={`Paso ${index + 1}`}
                value={item}
                onChangeText={(text) => {
                  setSteps((current) =>
                    current.map((value, i) => (i === index ? text : value))
                  );
                }}
                maxLength={LIMITS.step.max}
                multiline
                style={styles.multiline}
              />
            </View>
            {steps.length > 1 ? (
              <Pressable
                onPress={() => setSteps((current) => current.filter((_, i) => i !== index))}
                style={styles.removeBtn}
              >
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Quitar</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
        <UiButton
          label="Agregar paso"
          variant="secondary"
          onPress={() => setSteps((current) => [...current, ''])}
        />

        <Text style={[styles.section, { color: colors.text }]}>Grupos</Text>
        {myGroups.length === 0 ? (
          <Text style={{ color: colors.muted }}>
            No hay grupos. Puedes crearlos en la pestaña Grupos.
          </Text>
        ) : (
          <View style={styles.groups}>
            {myGroups.map((group) => {
              const selected = groupIds.includes(group.id);
              return (
                <Pressable
                  key={group.id}
                  onPress={() => toggleGroup(group.id)}
                  style={[
                    styles.groupChip,
                    {
                      borderColor: selected ? colors.tint : colors.border,
                      backgroundColor: selected ? colors.tint : colors.card,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected
                        ? scheme === 'dark'
                          ? '#0F1612'
                          : '#FFFFFF'
                        : colors.text,
                      fontWeight: '600',
                    }}
                  >
                    {group.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {error ? (
          <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
        ) : null}

        <UiButton
          label={mode === 'create' ? 'Crear receta' : 'Guardar cambios'}
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
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15 },
  form: { gap: 14 },
  section: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  row: { gap: 8 },
  rowField: { flex: 1 },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: 4 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: { fontSize: 14, fontWeight: '600' },
  preview: { width: '100%', height: 180, borderRadius: 14 },
  imageActions: { gap: 10 },
});
