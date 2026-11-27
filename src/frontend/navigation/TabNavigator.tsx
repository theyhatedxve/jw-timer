import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import AppIcon from '../components/common/AppIcon';
import { useAppTheme } from '../context/AppearanceContext';
import { useTabLayout } from '../hooks/useTabLayout';
import { styles } from '../styles/navigation/tabs.styles';
import { TABS } from './tabs';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const { palette } = useAppTheme();
  const { useRail, barStyle } = useTabLayout();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: palette.canvas },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        tabBarPosition: useRail ? 'left' : 'bottom',
        tabBarVariant: useRail ? 'material' : 'uikit',
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.secondary,
        tabBarActiveBackgroundColor: palette.selection,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
        tabBarItemStyle: styles.item,
        tabBarStyle: barStyle,
        sceneStyle: { backgroundColor: palette.canvas },
      }}
    >
      {TABS.map(({ name, label, icon, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title: label,
            headerShown: name !== 'Timer' && name !== 'Home' && name !== 'Meetings',
            tabBarAccessibilityLabel: label,
            tabBarIcon: ({ color, size }) => (
              <AppIcon name={icon} color={color} size={size} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.label, { color }]}>
                {label}
              </Text>
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
