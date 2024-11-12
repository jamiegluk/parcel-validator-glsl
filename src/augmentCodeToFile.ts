import { Asset, PluginOptions } from "@parcel/types";
import path from "node:path";
import { fileURLToPath } from "node:url";
import regexEscape from "regex-escape";
import { Config } from "./config";

/**
 * Injects additional code into the asset's code,
 * to handle plugin configuration and integrations.
 * If the code is modified, it will be written to a temporary file.
 * @param asset Parcel asset.
 * @param config Plugin configuration.
 * @param options Parcel options.
 * @param code Original asset code.
 * @returns Promise resolving to a tuple of:
 *   1. file path of the original asset or of the temporary modified asset
 *   2. count of lines that were injected into the code
 *   3. `true` if a temporary file was written, else `false`
 */
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

  // If we have injected code
  // then save to a temp file
  if (lineOffset) {
    filePath = path.join(options.cacheDir, `${name}-${asset.id}${ext}`);
    await asset.fs.writeFile(filePath, code, null);
    isTmpFile = true;
  }

  return [filePath, lineOffset, isTmpFile];
}

/**
 * Checks code for any `// parcel-validator-glsl foo` comments.
 * @param code GLSL code.
 * @param suffix Value of `foo` in `// parcel-validator-glsl foo`.
 * @returns `true` if comment exists, else `false`.
 */
function hasPluginComment(code: string, suffix: string): boolean {
  return new RegExp(
    `// parcel-validator-glsl ${regexEscape(suffix)}\s*$`,
    "m",
  ).test(code);
}

/**
 * Injects GLSL code ahead of existing code,
 * but ensuring to keep `#version` directive at the top of the file.
 * @param code GLSL code to modify.
 * @param versionEndIndex Index of character to inject code at, after the `#version` directive.
 * @param prefix GLSL code to be injected.
 * @param lineOffset Current line offset with code injected.
 * @returns Tuple of [modified code, new line offset when code injected]
 */
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

/**
 * Counts the number of lines in a string.
 * @param str The string.
 * @returns The number of lines.
 */
function countLines(str: string): number {
  return (str.match(/\n/g) || "").length + 1;
}
