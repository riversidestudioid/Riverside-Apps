import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createCatalogApi } from "./catalog-api";
async function main() {
  const mode = process.argv[2] ?? "catalog";
  const api = mode === "catalog" ? await createCatalogApi() : null;
  const port = api ? 3003 : 3004;
  const env = {
    ...process.env,
    RIVERSIDE_TEST_DIST_DIR: `.next-test-${mode}`,
    RIVERSIDE_TEST_TS_CONFIG: `.test-runtime/tsconfig-${mode}.json`,
    NEXT_PUBLIC_SUPABASE_URL: api?.url ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: api
      ? "test-only-publishable-key"
      : "",
  };
  await mkdir(".test-runtime", { recursive: true });
  await writeFile(
    env.RIVERSIDE_TEST_TS_CONFIG,
    JSON.stringify({
      extends: "../tsconfig.json",
      include: [
        "../next-env.d.ts",
        "../src/**/*.ts",
        "../src/**/*.tsx",
        `../${env.RIVERSIDE_TEST_DIST_DIR}/types/**/*.ts`,
        `../${env.RIVERSIDE_TEST_DIST_DIR}/dev/types/**/*.ts`,
      ],
      exclude: ["../node_modules"],
    }),
  );
  const child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { env, stdio: "inherit" },
  );
  if (api) console.log(`TEST_CATALOG_API=${api.url}`);
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    child.kill("SIGTERM");
    if (api) await api.close();
  }
  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
  child.on("exit", async (code) => {
    await stop();
    process.exit(code ?? 0);
  });
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
