import { View, Text, TouchableOpacity } from "react-native";

interface CustomCheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  value,
  onValueChange,
}) => {
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)}>
      <View
        style={{
          width: 20,
          height: 20,
          backgroundColor: value ? "blue" : "white",
          borderRadius: 5,
          borderWidth: 2,
          borderColor: "gray",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    </TouchableOpacity>
  );
};

export default CustomCheckbox;
