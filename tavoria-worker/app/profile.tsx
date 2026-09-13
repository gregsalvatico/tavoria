import { Redirect, useLocalSearchParams } from "expo-router";

export default function Profile() {
  const { applicationId, workerId } = useLocalSearchParams<{ applicationId?: string; workerId?: string }>();
  return <Redirect href={{ pathname: "/candidate", params: { ...(applicationId ? { applicationId } : {}), ...(workerId ? { workerId } : {}) } }} />;
}
