import { Asset, PluginOptions } from "@parcel/types";
import { Config } from "./config";
import path from "path";

export async function augmentCodeToFile(
  asset: Asset,
  config: Required<Config>,
  options: PluginOptions,
  code: string,
): Promise<[filePath: string, lineOffset: number, isTmpFile: boolean]> {
  let { filePath } = asset;
  let lineOffset = 0;
  let isTmpFile = false;

  if (!/^#version \d+(\s|$)/.test(code)) {
    code = `#version ${config.glslVersion}\n${code}`;
    lineOffset++;
  }

  if (lineOffset) {
    const { name, ext } = path.parse(filePath);
    filePath = path.join(options.cacheDir, `${name}-${asset.id}${ext}`);
    await asset.fs.writeFile(filePath, code, null);
    isTmpFile = true;
  }

  return [filePath, lineOffset, isTmpFile];
}
