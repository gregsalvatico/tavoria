import { Redirect } from "expo-router";

// Keep the legacy route, but send it to the single mixed media editor.
export default function WorkerMedia() {
  return <Redirect href={"/worker-media-edit" as never} />;
}
