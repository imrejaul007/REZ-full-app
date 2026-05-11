import { ExpoRoot } from "expo-router";

// Augment NodeRequire to include the webpack context method
declare global {
  interface NodeRequire {
    context: (
      directory: string,
      useSubdirectories?: boolean,
      regExp?: RegExp
    ) => any;
  }
}

export default function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}
