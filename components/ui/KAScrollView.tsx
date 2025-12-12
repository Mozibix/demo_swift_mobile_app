import { ReactNode, Ref } from "react";
import { ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function KAScrollView({
  children,
  scrollViewRef,
  styles,
}: {
  scrollViewRef?: Ref<KeyboardAwareScrollView>;
  children: ReactNode;
  styles?: ViewStyle;
}) {
  return (
    <KeyboardAwareScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 180,
        ...styles,
      }}
      extraScrollHeight={100}
      enableOnAndroid={true}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
