import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, radius, layout } from '@/theme';
import VerifyScreen from '@/screens/VerifyScreen';
import AlertsScreen from '@/screens/AlertsScreen';
import CommunityScreen from '@/screens/CommunityScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon with modern design
const TabBarIcon = ({ 
  name, 
  focused, 
  badge 
}: { 
  name: string; 
  focused: boolean; 
  badge?: number;
}) => {
  const iconMap: Record<string, any> = {
    Verify: 'shield-checkmark',
    Alerts: 'notifications',
    Community: 'chatbubbles',
    History: 'time',
    Profile: 'person',
  };

  return (
    <View style={styles.iconContainer}>
      <View style={[
        styles.iconWrapper,
        focused && styles.iconWrapperActive
      ]}>
        <Ionicons 
          name={iconMap[name] as any} 
          size={24} 
          color={focused ? colors.black : colors.gray400} 
        />
        {badge && badge > 0 && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge} />
          </View>
        )}
      </View>
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon 
            name={route.name} 
            focused={focused} 
            badge={route.name === 'Alerts' ? 3 : undefined}
          />
        ),
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarIndicatorStyle: { display: 'none' },
      })}
    >
      <Tab.Screen 
        name="Verify" 
        component={VerifyScreen}
        options={{ tabBarLabel: 'Verify' }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ tabBarLabel: 'Alerts' }}
      />
      <Tab.Screen 
        name="Community" 
        component={CommunityScreen}
        options={{ tabBarLabel: 'Community' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ tabBarLabel: 'History' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 68,
    backgroundColor: colors.white,
    borderTopWidth: 0,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingHorizontal: 8,
    elevation: 0,
    shadowColor: 'transparent',
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 48,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.lg,
    position: 'relative',
  },
  iconWrapperActive: {
    backgroundColor: colors.gray100,
  },
  badgeContainer: {
    position: 'absolute',
    top: 6,
    right: 10,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.red,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
