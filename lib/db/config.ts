import { setServers } from "node:dns";

export const DEFAULT_MONGODB_URI =
  "mongodb://127.0.0.1:27017/ai_intelligence_hub?replicaSet=rs0";

export function configureMongoDns(uri: string): void {
  if (process.platform === "win32" && uri.startsWith("mongodb+srv://")) {
    setServers(["1.1.1.1", "8.8.8.8"]);
  }
}
