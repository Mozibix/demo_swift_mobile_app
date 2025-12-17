import React, { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | any;
  circle?: boolean;
  speed?: number;
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = 100,
  height = 20,
  borderRadius = 4,
  style,
  circle = false,
  speed = 1000,
  containerStyle,
  children,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: speed,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: speed,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue, speed]);

  const animatedStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    }),
  };

  const loaderStyle = {
    width: circle ? height : width,
    height,
    borderRadius: circle ? height / 2 : borderRadius,
    backgroundColor: "#E0E3E8",
  };

  return (
    <View style={containerStyle}>
      <Animated.View style={[loaderStyle, animatedStyle, style]} />
      {children}
    </View>
  );
};

export default SkeletonLoader;
