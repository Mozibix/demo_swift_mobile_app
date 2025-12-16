import { cn } from "@/utils";
import { Fragment, ReactNode } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ViewStyle } from "react-native";

type ButtonProps = {
	onPress: () => void;
	isLoading?: boolean;
	text?: string;
	loadingText?: string;
	classNames?: string;
	disabled?: boolean;
	outlined?: boolean;
	asChild?: boolean;
	children?: ReactNode;
	styles?: ViewStyle;
	centered?: boolean;
	full?: boolean;
	danger?: boolean;
	uppercased?: boolean;
	smallText?: boolean;
	softBg?: boolean;
};

export default function Button({ onPress, isLoading, text, full, loadingText, classNames, disabled, outlined, asChild = false, children, styles = {}, centered = false, danger = false, uppercased = false, softBg = false, smallText = false }: ButtonProps) {
	return (
		<TouchableOpacity activeOpacity={disabled ? 1 : 0.7} style={styles} className={cn("bg-swiftPayBlue p-5 rounded-xl mt-5 font-semibold min-w-[100px]", classNames, isLoading && "opacity-70", outlined && "bg-transparent border border-swiftPayBlue", softBg && "bg-[#e5edff]", disabled && "bg-gray-400 border-0", centered && "self-center", full && "w-full", danger && "bg-[#c81e1e]")} onPress={disabled ? () => {} : onPress} disabled={isLoading}>
			{asChild ? (
				children
			) : (
				<Fragment>
					{isLoading ? (
						<View className="flex-row justify-center items-center">
							<ActivityIndicator color="#fff" size="small" />
							<Text className={cn("text-white text-[17px] ml-2 font-semibold", uppercased && "uppercase", softBg && "text-swiftPayBlue")}>{loadingText ?? "Loading..."}</Text>
						</View>
					) : (
						<Text className={cn("text-white text-[17px] text-center font-semibold", outlined && "text-swiftPayBlue", disabled && "text-white", uppercased && "uppercase", softBg && "text-swiftPayBlue", smallText && "text-[15px]")}>{text}</Text>
					)}
				</Fragment>
			)}
		</TouchableOpacity>
	);
}
