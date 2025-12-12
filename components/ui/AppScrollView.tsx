import { ReactNode, useRef } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  View,
  ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type ScrollViewProps = {
  children: ReactNode;
  noMargin?: boolean;
  containerStyles?: ViewStyle;
  wouldRefresh?: boolean;
  refresh?: boolean;
  handleRefresh?: VoidFunction;
  scrollHeight?: number;
};

export default function AppScrollView({
  children,
  noMargin,
  containerStyles,
  wouldRefresh = false,
  refresh,
  handleRefresh,
  scrollHeight = 100,
}: ScrollViewProps) {
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  return (
    <View className="flex-1 bg-white">
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: Platform.OS === "ios" ? 200 : 160,
          marginTop: noMargin ? 0 : Platform.OS === "ios" ? 100 : 0,
          ...containerStyles,
        }}
        extraScrollHeight={scrollHeight}
        enableOnAndroid={true}
        refreshControl={
          wouldRefresh ? (
            <RefreshControl
              refreshing={refresh ?? false}
              onRefresh={handleRefresh}
              progressBackgroundColor={"#1400FB"}
              tintColor={"#1400FB"}
            />
          ) : undefined
        }
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}
