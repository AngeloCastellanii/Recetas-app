import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';

export default function IndexRoute() {
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/(app)/(tabs)/recipes" />;
  }

  return <Redirect href="/(auth)/login" />;
}
