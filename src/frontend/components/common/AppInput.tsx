import { TextInput, type TextInputProps } from 'react-native';

import { useAppTheme } from '../../context/AppearanceContext';

export default function AppInput({
  style,
  ...props
}: Omit<TextInputProps, 'className'>) {
  const { palette } = useAppTheme();

  return (
    <TextInput
      placeholderTextColor={palette.secondary}
      selectionColor={palette.brand}
      {...props}
      className="min-h-app-touch rounded-app-button border border-app-border bg-app-surface p-app-medium text-app-body text-app-text"
      style={style}
    />
  );
}
