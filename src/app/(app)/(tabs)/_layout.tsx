import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { useClientOnlyValue } from '@/components/use-client-only-value';
import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';

function TabBarIcon(props: {
  name: ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -2 }} {...props} />;
}

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
            <TabBarIcon name="cutlery" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: 'Mis recetas',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="user" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="folder-open" color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="cog" color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
