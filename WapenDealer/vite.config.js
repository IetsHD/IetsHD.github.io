import { defineConfig } from "vite";
import { sites } from "@openai/sites-vite-plugin";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEFAULT_SITE_ORIGIN = "https://obsidian-catalogus.stefanvd-berg.chatgpt.site";

function getDeploymentContext() {
  const githubRepository = process.env.GITHUB_REPOSITORY;
  const isGitHubBuild = process.env.GITHUB_ACTIONS === "true" && githubRepository;

  if (!isGitHubBuild) {
    return {
      base: "/",
      isGitHubBuild: false,
      siteOrigin: process.env.SITE_ORIGIN || DEFAULT_SITE_ORIGIN
    };
  }

  const [owner, repository] = githubRepository.split("/");
  const isAccountSite = repository.toLowerCase() === `${owner}.github.io`.toLowerCase();
  const projectPath = isAccountSite ? "" : `/${repository}`;

  return {
    base: isAccountSite ? "/" : `/${repository}/`,
    isGitHubBuild: true,
    siteOrigin: process.env.SITE_ORIGIN || `https://${owner}.github.io${projectPath}`
  };
}

function injectDeploymentMetadata(siteOrigin) {
  const normalizedOrigin = siteOrigin.replace(/\/$/, "");

  return {
    name: "inject-deployment-metadata",
    transformIndexHtml(html) {
      return html.replaceAll("__SITE_ORIGIN__", normalizedOrigin);
    }
  };
}

function emitStaticWorker() {
  return {
    name: "emit-static-worker",
    apply: "build",
    async closeBundle() {
      const serverDirectory = resolve("dist/server");
      await mkdir(serverDirectory, { recursive: true });
      await writeFile(
        resolve(serverDirectory, "index.js"),
        "export default { fetch(request, env) { return env.ASSETS.fetch(request); } };\n"
      );
    }
  };
}

const deployment = getDeploymentContext();

export default defineConfig({
  base: deployment.base,
  plugins: [
    injectDeploymentMetadata(deployment.siteOrigin),
    ...(deployment.isGitHubBuild ? [] : [sites(), emitStaticWorker()])
  ]
});
