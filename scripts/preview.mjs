import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const filename = path.resolve(".next/standalone/server.js");
if (!existsSync(filename)) throw new Error("Run npm run build before npm run preview.");
const server = spawn(process.execPath, [filename], {
  env: {
    ...process.env,
    PORT: process.env.PORT ?? "4173",
    HOSTNAME: process.env.HOSTNAME ?? "127.0.0.1",
  },
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => server.kill(signal));
server.once("error", (error) => {
  console.error(error);
  process.exitCode = 1;
});
server.once("exit", (code) => {
  process.exitCode = code ?? 0;
});
