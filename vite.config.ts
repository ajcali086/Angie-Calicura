import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { execFileSync } from "node:child_process";
import { measureImages } from "./scripts/measure-images.mjs";

// Same stack as spirit-of-martinez, without its auth, database, audio,
// search and PWA plugins. Nitro's Vercel preset only joins for builds.
export default defineConfig(({ command, isPreview }) => ({
  server: { host: "0.0.0.0", port: 8080, strictPort: true },
  preview: { host: "127.0.0.1", port: 8081, strictPort: true },
  resolve: { tsconfigPaths: true },
  plugins: [
    // Image sizes come from the files (scripts/measure-images.mjs), measured
    // before anything imports them, however the build was started.
    { name: "measure-images", config: () => void measureImages() },
    // The CMS's config and ID key, generated from the model (scripts/cms-build.ts).
    {
      name: "cms-build",
      config: () =>
        void execFileSync(
          process.execPath,
          [
            "--experimental-strip-types",
            "--import",
            "./scripts/test-register.mjs",
            "scripts/cms-build.ts",
          ],
          { stdio: "inherit" },
        ),
    },
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview ? [nitro({ preset: "vercel" })] : []),
    viteReact(),
  ],
}));
