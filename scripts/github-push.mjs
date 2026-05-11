#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "umidjonalimardonov23-rgb";
const REPO = "botmarket";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`;

const headers = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
};

const EXCLUDED_DIRS = new Set([
  "node_modules", ".git", ".local", "attached_assets",
  "mockup-sandbox", ".cache", ".replit-artifact", "dist", "tmp"
]);

const EXCLUDED_EXTS = new Set([".map", ".log", ".lock"]);
const INCLUDED_LOCKS = new Set(["pnpm-lock.yaml"]);

function collectFiles(dir, root) {
  const results = [];
  let entries;
  try { entries = readdirSync(dir); } catch { return results; }
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    let stat;
    try { stat = statSync(fullPath); } catch { continue; }
    if (stat.isDirectory()) {
      results.push(...collectFiles(fullPath, root));
    } else {
      const ext = entry.lastIndexOf(".") > 0 ? entry.slice(entry.lastIndexOf(".")) : "";
      if (EXCLUDED_EXTS.has(ext) && !INCLUDED_LOCKS.has(entry)) continue;
      if (stat.size > 5 * 1024 * 1024) { console.warn(`  Skipping large file: ${entry}`); continue; }
      results.push({ path: relative(root, fullPath), fullPath });
    }
  }
  return results;
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { headers, ...options });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

async function main() {
  const root = "/home/runner/workspace";
  console.log("Collecting files...");
  const files = collectFiles(root, root);
  console.log(`Found ${files.length} files`);

  // Create blobs
  console.log("Creating blobs...");
  const treeItems = [];
  let processed = 0;

  for (const file of files) {
    try {
      const content = readFileSync(file.fullPath);
      const blob = await apiFetch(`${BASE_URL}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: content.toString("base64"), encoding: "base64" }),
      });
      if (blob && blob.sha) {
        treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
        processed++;
      } else {
        console.warn(`  No SHA for ${file.path}:`, JSON.stringify(blob).slice(0, 100));
      }
      if (processed % 25 === 0 && processed > 0) console.log(`  ${processed} blobs done`);
    } catch (err) {
      console.warn(`  Skip ${file.path}: ${err.message}`);
    }
  }

  console.log(`Created ${treeItems.length} blobs`);
  if (treeItems.length === 0) { console.error("No blobs created!"); process.exit(1); }

  // Create tree (no base_tree for empty repo)
  console.log("Creating tree...");
  const tree = await apiFetch(`${BASE_URL}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ tree: treeItems }),
  });
  if (!tree.sha) { console.error("Tree failed:", JSON.stringify(tree).slice(0, 200)); process.exit(1); }
  console.log("Tree:", tree.sha);

  // Create commit
  console.log("Creating commit...");
  const commit = await apiFetch(`${BASE_URL}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "BotMarket: Professional Telegram bot ordering platform\n\nTelegram bot + Mini App + Railway deploy",
      tree: tree.sha,
      author: { name: "BotMarket", email: "bot@botmarket.uz", date: new Date().toISOString() },
      parents: [],
    }),
  });
  if (!commit.sha) { console.error("Commit failed:", JSON.stringify(commit).slice(0, 200)); process.exit(1); }
  console.log("Commit:", commit.sha);

  // Create main branch
  console.log("Creating main branch...");
  const ref = await apiFetch(`${BASE_URL}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: "refs/heads/main", sha: commit.sha }),
  });
  if (ref.ref) {
    console.log("✅ Pushed to GitHub!");
    console.log(`📦 https://github.com/${OWNER}/${REPO}`);
  } else {
    // Maybe branch already exists, force push
    const update = await apiFetch(`${BASE_URL}/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: true }),
    });
    if (update.ref || update.object) {
      console.log("✅ Updated GitHub!");
      console.log(`📦 https://github.com/${OWNER}/${REPO}`);
    } else {
      console.error("Ref failed:", JSON.stringify(ref).slice(0, 200));
      process.exit(1);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
