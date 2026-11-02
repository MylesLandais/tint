#!/usr/bin/env node
// Export Tint's CSS tokens as a Penpot token file (W3C DTCG, multi-set).
//
// Tint CSS stays authoritative: this reads src/styles and writes
// design/tokens/tint.tokens.json. Never edit the JSON by hand; re-run
//   node scripts/export-tokens.mjs          (write)
//   node scripts/export-tokens.mjs --check  (fail if the JSON is stale)
//
// Sets:
//   global              layout scale (spacing, radius, control size, type)
//   <theme>/light|dark  colour contract; light-dark() pairs split by scheme
// Penpot themes pair global with one colour set, grouped by family.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const styles = join(root, "src/styles");
const out = join(root, "design/tokens/tint.tokens.json");
const REM = 16;

// Single-scheme palettes: the flavor fixes the scheme (see latte.css).
const SINGLE_SCHEME = { latte: "light", frappe: "dark", macchiato: "dark", mocha: "dark" };

function declarations(css) {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // First rule block only: later blocks are media/reduced-motion overrides.
  const block = body.slice(body.indexOf("{") + 1, body.indexOf("}"));
  const decls = {};
  for (const m of block.matchAll(/--tint-([\w-]+)\s*:\s*([^;]+);/g)) decls[m[1]] = m[2].trim();
  return decls;
}

function splitLightDark(value) {
  const m = value.match(/^light-dark\((.*)\)$/s);
  if (!m) return [value, value];
  // Split on the top-level comma only; rgb(... / ...) contains spaces, not commas.
  let depth = 0;
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) return [m[1].slice(0, i).trim(), m[1].slice(i + 1).trim()];
  }
  throw new Error(`unbalanced light-dark(): ${value}`);
}

// Penpot colour tokens take hex; normalise rgb(r g b / a).
function color(value) {
  const m = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/);
  if (!m) return value.toLowerCase();
  const hex = (n) => Number(n).toString(16).padStart(2, "0");
  let a = "";
  if (m[4] !== undefined) {
    const alpha = m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    a = hex(Math.round(alpha * 255));
  }
  return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}${a}`;
}

const px = (v) => {
  const m = v.match(/^([\d.]+)(rem|px)$/);
  if (!m) throw new Error(`not a length: ${v}`);
  return String(+(m[2] === "rem" ? parseFloat(m[1]) * REM : parseFloat(m[1])).toFixed(2));
};

function globalSet() {
  const d = declarations(readFileSync(join(styles, "layout-scale.css"), "utf8"));
  const set = {};
  const put = (group, name, type, value) => {
    set[group] ??= {};
    set[group][name] = { $type: type, $value: value };
  };
  for (const [k, v] of Object.entries(d)) {
    let m;
    if ((m = k.match(/^space-(\d+)$/))) put("space", m[1], "spacing", px(v));
    else if ((m = k.match(/^radius-(\w+)$/))) put("radius", m[1], "borderRadius", px(v));
    else if ((m = k.match(/^control-(\w+)$/))) put("control", m[1], "sizing", px(v));
    else if ((m = k.match(/^font-size-(\w+)$/))) put("font-size", m[1], "fontSizes", px(v));
    else if ((m = k.match(/^leading-(\w+)$/))) put("leading", m[1], "number", v);
    else if ((m = k.match(/^focus-(\w+)$/))) put("focus", m[1], "borderWidth", px(v));
    // motion/ease: no Penpot token type; CSS-only.
  }
  return set;
}

function colorSets(theme) {
  const d = declarations(readFileSync(join(styles, "themes", `${theme}.css`), "utf8"));
  const schemes = SINGLE_SCHEME[theme] ? [SINGLE_SCHEME[theme]] : ["light", "dark"];
  const sets = {};
  for (const scheme of schemes) {
    const set = {};
    for (const [k, v] of Object.entries(d)) {
      const [light, dark] = splitLightDark(v);
      const value = color(scheme === "light" ? light : dark);
      if (!/^#[0-9a-f]{3,8}$/.test(value)) continue; // non-colour (none so far)
      // "accent-hover" -> color.accent.hover, so Penpot groups related roles.
      const [group, ...rest] = k.split("-");
      set.color ??= {};
      set.color[group] ??= {};
      set.color[group][rest.length ? rest.join("-") : "default"] = { $type: "color", $value: value };
    }
    sets[`${theme}/${scheme}`] = set;
  }
  return sets;
}

const themes = readdirSync(join(styles, "themes"))
  .filter((f) => f.endsWith(".css"))
  .map((f) => f.slice(0, -4))
  .sort((a, b) => (a === "tint" ? -1 : b === "tint" ? 1 : a.localeCompare(b)));

const doc = { global: globalSet() };
for (const t of themes) Object.assign(doc, colorSets(t));
const colorSetNames = Object.keys(doc).filter((s) => s !== "global");
doc.$themes = colorSetNames.map((s) => {
  const [family, scheme] = s.split("/");
  return {
    name: scheme,
    group: family,
    selectedTokenSets: { global: "enabled", [s]: "enabled" },
  };
});
doc.$metadata = { tokenSetOrder: ["global", ...colorSetNames] };

const json = JSON.stringify(doc, null, 2) + "\n";
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(out, "utf8");
  } catch {}
  if (current !== json) {
    console.error(`${out} is stale; run node scripts/export-tokens.mjs`);
    process.exit(1);
  }
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, json);
  console.log(`wrote ${out}: ${colorSetNames.length} colour sets, ${doc.$themes.length} themes`);
}
