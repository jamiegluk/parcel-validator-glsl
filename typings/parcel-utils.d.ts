declare module "@parcel/utils" {
  import type { ConfigResult, File, FilePath, Glob } from "@parcel/types";
  import type { FileSystem } from "@parcel/fs";
  import type { Options } from "micromatch";

  // config
  // https://github.com/parcel-bundler/parcel/blob/9242243c9af6f593f76ef4e44bc0d88b826126ab/packages/core/utils/src/config.js

  export type ConfigOutput = {
    config: ConfigResult;
    files: Array<File>;
  };

  export type ConfigOptions = {
    parse?: boolean;
    parser?: <T>(arg: string) => T;
  };

  export function loadConfig(
    fs: FileSystem,
    filepath: FilePath,
    filenames: FilePath[],
    projectRoot: FilePath,
    opts?: ConfigOptions,
  ): Promise<ConfigOutput | null>;

  // glob
  // https://github.com/parcel-bundler/parcel/blob/9242243c9af6f593f76ef4e44bc0d88b826126ab/packages/core/utils/src/glob.js
  export function isGlobMatch(
    filePath: FilePath,
    glob: Glob | Array<Glob>,
    opts?: Options,
  ): any;
}
