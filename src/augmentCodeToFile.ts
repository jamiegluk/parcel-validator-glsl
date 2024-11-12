import { Asset, PluginOptions } from "@parcel/types";
import { Config } from "./config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import regexEscape from "regex-escape";

export async function augmentCodeToFile(
  asset: Asset,
  config: Required<Config>,
  options: PluginOptions,
  code: string,
): Promise<[filePath: string, lineOffset: number, isTmpFile: boolean]> {
  let { filePath } = asset;
  let lineOffset = 0;
  let isTmpFile = false;

  const { name, ext } = path.parse(filePath);

  // Locate or insert version directive
  let versionEndIndex = 0;
  const versionMatch = code.match(
    /^(\s*|\s*\/\/.*\n)*#version \d+(\s+[a-z]+)?\s*(?=\n|$)/,
  );
  if (versionMatch) {
    versionEndIndex = versionMatch[0].length;
  } else {
    const versionLine = `#version ${config.glslVersion} es\n`;
    versionEndIndex = versionLine.length;
    code = versionLine + code;
    lineOffset++;
  }

  // Three.js integration
  if (
    hasPluginComment(code, "three") ||
    (config.threeIntegration && !hasPluginComment(code, "no-three"))
  ) {
    let url: URL | null = null;
    switch (ext) {
      case ".vert":
        url = new URL("three.vert", import.meta.url);
        break;
      case ".frag":
        url = new URL("three.frag", import.meta.url);
        break;
    }
    if (url) {
      const buffer = await asset.fs.readFile(fileURLToPath(url));
      const prefix = buffer.toString();
      [code, lineOffset] = prefixCode(
        code,
        versionEndIndex,
        prefix,
        lineOffset,
      );
    }
  }

  // Three-CustomShaderMaterial integration
  if (
    hasPluginComment(code, "csm") ||
    (config.csmIntegration && !hasPluginComment(code, "no-csm"))
  ) {
    let url: URL | null = null;
    switch (ext) {
      case ".vert":
        url = new URL("csm.vert", import.meta.url);
        break;
      case ".frag":
        url = new URL("csm.frag", import.meta.url);
        break;
    }
    if (url) {
      const buffer = await asset.fs.readFile(fileURLToPath(url));
      const prefix = buffer.toString();
      [code, lineOffset] = prefixCode(
        code,
        versionEndIndex,
        prefix,
        lineOffset,
      );
    }
  }

  if (lineOffset) {
    filePath = path.join(options.cacheDir, `${name}-${asset.id}${ext}`);
    await asset.fs.writeFile(filePath, code, null);
    isTmpFile = true;
  }

  return [filePath, lineOffset, isTmpFile];
}

function hasPluginComment(code: string, suffix: string): boolean {
  return new RegExp(
    `// parcel-validator-glsl ${regexEscape(suffix)}\s*$`,
    "m",
  ).test(code);
}

function prefixCode(
  code: string,
  versionEndIndex: number,
  prefix: string,
  lineOffset: number,
): [code: string, lineOffset: number] {
  const lineCount = countLines(code);
  code =
    code.substring(0, versionEndIndex) +
    "\n" +
    prefix +
    "\n" +
    code.substring(versionEndIndex);
  return [code, lineOffset + countLines(code) - lineCount];
}

function countLines(str: string): number {
  return (str.match(/\n/g) || "").length + 1;
}
