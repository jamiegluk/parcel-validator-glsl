declare module "@parcel/utils" {
  import type { ConfigResult, File, FilePath } from "@parcel/types";
  import type { FileSystem } from "@parcel/fs";

  // config
  // https://github.com/parcel-bundler/parcel/blob/9242243c9af6f593f76ef4e44bc0d88b826126ab/packages/core/utils/src/config.js

  export type ConfigOutput = {
    config: ConfigResult;
    files: Array<File>;
  };

  export type ConfigOptions = {
    parse?: boolean;
    parser?: (arg: string) => any;
  };

  export function loadConfig(
    fs: FileSystem,
    filepath: FilePath,
    filenames: Array<FilePath>,
    projectRoot: FilePath,
    opts?: ConfigOptions,
  ): Promise<ConfigOutput | null>;
}
