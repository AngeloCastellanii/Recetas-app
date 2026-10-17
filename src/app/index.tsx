import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useColorScheme } from '@/components/use-color-scheme';
import Colors from '@/constants/colors';
import { useAuth } from '@/context/auth-context';
import { usePreferences } from '@/context/preferences-context';

export default function IndexRoute() {
  const { user, isLoading: authLoading } = useAuth();
  const { preferences, isLoading: prefsLoading } = usePreferences();
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  if (authLoading || prefsLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!preferences.onboardingDone) {
    return <Redirect href={'/onboarding' as Href} />;
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/recipes" />;
  }

  return <Redirect href="/(auth)/login" />;
}
