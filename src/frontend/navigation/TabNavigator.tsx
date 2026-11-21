import { useAppTheme } from '../context/AppearanceContext';
import { Text, useWindowDimensions } from 'react-native';

import {
  useNavigation,
} from '@react-navigation/native';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  dimensions,
  spacing,
  typography,
} from '../../constants/theme';

import SettingsButton from '../components/common/SettingsButton';
import { styles } from '../styles/navigation/tabs.styles';

import { TABS } from './tabs';

import type {
  MainTabParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const { palette: colors } = useAppTheme();
  const navigation = useNavigation();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const useRail =
    width >= dimensions.navigationRailBreakpoint;

  const bottomBarHeight =
    typography.navigationLineHeight * fontScale * 3 +
    spacing.medium +
    insets.bottom;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.canvas,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => (
          <SettingsButton
            onPress={() => navigation.navigate('Settings')}
          />
        ),
        tabBarPosition: useRail ? 'left' : 'bottom',
        tabBarVariant: useRail ? 'material' : 'uikit',
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.secondary,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
        tabBarIcon: () => null,
        tabBarIconStyle: styles.hiddenIcon,
        tabBarItemStyle: styles.item,
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          useRail
            ? { width: dimensions.navigationRailWidth }
            : { height: bottomBarHeight },
        ],
        sceneStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      {TABS.map(({ name, label, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title: label,
            tabBarAccessibilityLabel: label,
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
