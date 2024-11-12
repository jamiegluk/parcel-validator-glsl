import ThrowableDiagnostic, { escapeMarkdown } from "@parcel/diagnostic";
import { Validator } from "@parcel/plugin";
// @ts-ignore -- Parcel can't seem to recognize the typings for this, but Typescript does
import { loadConfig } from "@parcel/utils";
import { exec } from "node:child_process";
import { createRequire } from "node:module";
import { augmentCodeToFile } from "./augmentCodeToFile";
import { Config, DEFAULT_CONFIG, validateConfig } from "./config";
import { parseValidateResult } from "./parseValidateResult";

// Workaround for https://github.com/parcel-bundler/parcel/issues/6925#issuecomment-1003935487
const req = createRequire(__dirname);

/**
 * Parcel validator plugin for GLSL files.
 */
export const GLSLValidator = new Validator({
  async getConfig({ asset, resolveConfig, options }) {
    const configNames = [
      "parcel-validator-glsl.config.json",
      "parcel-validator-glsl.config.js",
    ];
    const filePath = await resolveConfig(configNames);
    if (filePath) {
      // Observe changes to the config
      // @ts-expect-error -- type is missing, but function exists
      asset.invalidateOnFileChange(filePath);

      // For whatever reason, the validator doesn't rerun when the file changes
      // So manually request such
      // @ts-expect-error -- type is missing, but function exists
      asset.invalidateOnFileChange(asset.filePath);
      // Nor does it rerun when the build is restarted
      // @ts-expect-error -- type is missing, but function exists
      asset.invalidateOnStartup();
    }

    // Load and validate the config
    const loadedConfig = await loadConfig(
      asset.fs,
      asset.filePath,
      configNames,
      options.projectRoot,
    );
    const config: Required<Config> = {
      ...DEFAULT_CONFIG,
      ...(loadedConfig?.config ?? {}),
    };
    validateConfig(config);
    return config;
  },

  async validate({ asset, logger, config: _config, options }) {
    const config = _config as Readonly<Required<Config>>;

    // Get OS independent path to validator
    let validator = "glslang-validator-prebuilt-predownloaded/bin/";
    switch (process.platform) {
      case "darwin":
        validator += "glslangValidator.darwin";
        break;
      case "win32":
        validator += "glslangValidator.exe";
        break;
      case "linux":
        validator += "glslangValidator.linux";
        break;
      default:
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: "Platform not supported: " + process.platform,
          },
        });
    }

    // Resolve path to validator
    validator = req.resolve(validator);

    // Load code
    // and inject any extra code for validation to satisfy configurations and integrations
    const code = await asset.getCode();
    const [filePath, lineOffset, isTmpFile] = await augmentCodeToFile(
      asset,
      config,
      options,
      code,
    );

    // Add standard arguments and options
    const cmd = `"${validator}" -l -DVALIDATE ${config.commandArguments} "${filePath}"`;

    // Run the `glslValidator` command and handle the output
    return new Promise((resolve) => {
      exec(cmd, async (error, stdout, stderr) => {
        // Clean up temp file
        if (isTmpFile) {
          try {
            await asset.fs.rimraf(filePath);
          } catch {}
        }

        let message: string;
        if (error) {
          // Validation failed
          message =
            stdout || stderr
              ? ["GLSL validation failed", stdout, stderr].join("\n")
              : error.message || "Unknown error";
        } else {
          // Validation passed
          // There may still be warnings
          message = ["GLSL validation passed, with warnings", stdout, stderr]
            .filter(Boolean)
            .join("\n");
        }
        // Parse errors and warnings
        const result = parseValidateResult(
          message,
          asset,
          code,
          filePath,
          lineOffset,
        );

        // Handle any output in the case no errors or warnings could be parsed
        if (result.errors.length === 0 && result.warnings.length === 0) {
          if (stdout && stdout.trim() !== filePath) {
            logger.log({
              message: escapeMarkdown(stdout),
            });
          }
          if (stderr) {
            logger.error({
              message: escapeMarkdown(stderr),
            });
          }
        }

        // Forward the result
        resolve(result);
      });
    });
  },
});
