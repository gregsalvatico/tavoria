import { Redirect, useLocalSearchParams } from "expo-router";

export default function WorkerBonus() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return <Redirect href={mode === "edit" ? "/worker-profile-edit" as never : "/candidate"} />;
}
