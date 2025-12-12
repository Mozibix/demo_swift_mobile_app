import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ value, onValueChange }) => {
  return (
    <TouchableOpacity
      style={[styles.switchContainer, value ? styles.switchOn : styles.switchOff]}
      onPress={() => onValueChange(!value)}
    >
      <View style={[styles.circle, value ? styles.circleOn : styles.circleOff]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  switchContainer: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 4,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#0000ff',
    alignItems: 'flex-end',
  },
  switchOff: {
    backgroundColor: '#ccc',
    alignItems: 'flex-start',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  circleOn: {
    backgroundColor: '#fff',
  },
  circleOff: {
    backgroundColor: '#fff',
  },
});

export default CustomSwitch;
