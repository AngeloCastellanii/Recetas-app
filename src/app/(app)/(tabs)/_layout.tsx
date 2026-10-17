import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import { useClientOnlyValue } from '@/components/use-client-only-value';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';

export default function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recetas',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'fork.knife',
                android: 'restaurant',
                web: 'restaurant',
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: 'Mis recetas',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person.crop.rectangle',
                android: 'person',
                web: 'person',
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'folder',
                android: 'folder',
                web: 'folder',
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: 'person.circle',
                android: 'account_circle',
                web: 'account_circle',
              }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
