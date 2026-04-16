/**
 * Tab bar layout
 *
 * 4 tabs: Home, Tasks, Timeline, Settings
 * Matches rough UI sketches (screen1: Home with bottom nav).
 * Custom tab bar style — minimal, clean, consistent with design system.
 */

import { Tabs, router } from 'expo-router';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius, Shadow, Spacing, Layout } from '../../constants/spacing';
import { FontSize } from '../../constants/typography';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IconName;
  focused: boolean;
  label: string;
}

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.tabActive : Colors.tabInactive}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.wrapper}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} label="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'}
              focused={focused}
              label="Tasks"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'time' : 'time-outline'}
              focused={focused}
              label="Timeline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              focused={focused}
              label="Stats"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              label="Settings"
            />
          ),
        }}
      />
    </Tabs>

      {/* Persistent chat FAB — visible on all tabs */}
      <TouchableOpacity
        style={styles.chatFab}
        onPress={() => router.push('/chat' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: Spacing[2],
    paddingBottom: Platform.OS === 'ios' ? Spacing[6] : Spacing[2],
    ...Shadow.md,
  },
  tabBarItem: {
    paddingTop: Spacing[1],
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 32,
    borderRadius: Radius.md,
  },
  tabItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  wrapper: {
    flex: 1,
  },
  chatFab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 108 : 84,
    right: Layout.screenPaddingH,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    ...Shadow.lg,
  },
});
