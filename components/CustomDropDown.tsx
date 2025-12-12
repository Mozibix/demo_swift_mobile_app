import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";

interface DropdownProps {
  label: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
}

const CustomDropDown: React.FC<DropdownProps> = ({
  label,
  options,
  onSelect,
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [heightAnimation] = useState(new Animated.Value(0));

  const toggleDropdown = () => {
    setVisible(!visible);
    Animated.timing(heightAnimation, {
      toValue: visible ? 0 : 150, // Adjust this value depending on how many options you want visible
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleSelect = (value: string) => {
    setSelectedValue(value);
    toggleDropdown();
    onSelect(value);
  };

  return (
    <View style={styles.dropdown}>
      <TouchableOpacity style={styles.dropdownHeader} onPress={toggleDropdown}>
        <Text style={styles.selectedText}>
          {selectedValue ? selectedValue : label}
        </Text>
        <AntDesign name={visible ? "up" : "down"} size={16} color="black" />
      </TouchableOpacity>

      <Animated.View style={[styles.dropdownList, { height: heightAnimation }]}>
        {visible && (
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleSelect(item.label)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    marginBottom: 20,
  },
  dropdownHeader: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedText: {
    fontSize: 16,
    color: "#666",
  },
  dropdownList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginTop: 10,
  },
  dropdownItem: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
});

export default CustomDropDown;
