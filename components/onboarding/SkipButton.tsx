import { navigationWithReset } from "@/utils";
import Button from "../ui/Button";
import { useNavigation } from "expo-router";

export default function SkipButton({ classNames }: { classNames: string }) {
  const navigation = useNavigation();

  function goToLogin() {
    navigationWithReset(navigation, "login");
  }

  return <Button text="Skip" onPress={goToLogin} classNames={classNames} />;
}
