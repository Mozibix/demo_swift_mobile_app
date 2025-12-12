// components/CustomCheckbox.tsx
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange }) => {
  return (
    <TouchableOpacity onPress={onChange} style={styles.checkboxContainer}>
      {checked ? (
        <Ionicons name="checkmark-circle" size={24} color="#4630EB" />
      ) : (
        <Ionicons name="ellipse-outline" size={24} color="#4630EB" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    marginRight: 8,
    borderRadius: 1
  },
});

export default CustomCheckbox;
