/**
 * Root layout – initializes auth listener and routes between
 * the auth flow and the main tabs based on authentication state.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  useAuth();
  useTasks();
  const isOnline = useNetworkStatus();

  return (
    <SafeAreaProvider>
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <OfflineBanner visible={!isOnline} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/new"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="task/[id]"
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>
    </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
