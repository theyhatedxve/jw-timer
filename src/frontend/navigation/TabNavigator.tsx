import { styles } from '../styles/navigation/tabs.styles';
import { Text, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, dimensions, spacing, typography } from '../../constants/theme';
import { TABS } from './tabs';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function TabNavigator() {
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const useRail = width >= dimensions.navigationRailBreakpoint;
  const bottomBarHeight = typography.navigationLineHeight * fontScale * 3 + spacing.medium + insets.bottom;

  return <Tab.Navigator initialRouteName="Home" backBehavior="initialRoute" screenOptions={{
    headerShown: false,
    tabBarPosition: useRail ? 'left' : 'bottom',
    tabBarVariant: useRail ? 'material' : 'uikit',
    tabBarActiveTintColor: colors.brand,
    tabBarInactiveTintColor: colors.secondary,
    tabBarHideOnKeyboard: true,
    tabBarAllowFontScaling: true,
    tabBarIcon: () => null,
    tabBarIconStyle: styles.hiddenIcon,
    tabBarItemStyle: styles.item,
    tabBarStyle: [styles.bar, useRail ? { width: dimensions.navigationRailWidth } : { height: bottomBarHeight }],
    sceneStyle: { backgroundColor: colors.canvas },
  }}>
    {TABS.map(({ name, label, component }) => <Tab.Screen key={name} name={name} component={component} options={{
      title: label,
      tabBarAccessibilityLabel: label,
      tabBarLabel: ({ color }) => <Text style={[styles.label, { color }]}>{label}</Text>,
    }} />)}
  </Tab.Navigator>;
}


