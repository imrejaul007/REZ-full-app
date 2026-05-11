import { ExpoRoot } from "expo-router";

export default function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = (require as any).context("./app");
  return <ExpoRoot context={ctx} />;
}
