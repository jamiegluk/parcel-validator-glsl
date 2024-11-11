import ThrowableDiagnostic, {
  DiagnosticCodeHighlight,
  escapeMarkdown,
} from "@parcel/diagnostic";
import { Validator } from "@parcel/plugin";
// @ts-ignore -- Parcel can't seem to recognize the typings for this, but Typescript does
import { loadConfig } from "@parcel/utils";
import { exec } from "child_process";
import { createRequire } from "module";
import { Config, DEFAULT_CONFIG, validateConfig } from "./config";

// Workaround https://github.com/parcel-bundler/parcel/issues/6925#issuecomment-1003935487
const req = createRequire(__dirname);

/**
 * Parcel optimizer plugin to remove the #version directive from GLSL files.
 */
export default new Validator({
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

  async validate({ asset, logger, config: _config }) {
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

    // TODO append to code
    const code = await asset.getCode();

    // Add standard arguments and options
    const cmd = `"${validator}" -l -DVALIDATE ${config.commandArguments} "${asset.filePath}"`;

    // Run the glslValidator command and handle the output
    return new Promise((resolve) => {
      exec(cmd, async (error, stdout, stderr) => {
        if (error) {
          // Validation failed
          let message =
            stdout || stderr
              ? ["GLSL Validation failed", stdout, stderr].join("\n")
              : error.message || "Unknown error";

          // Parse code highlights
          const createRegex = () => /^ERROR: (.+):(\d+): (.+)$/gm;
          const matches = Array.from(message.matchAll(createRegex()));
          const codeHighlights: DiagnosticCodeHighlight[] = matches.map(
            ([, , line, err]) => {
              // TODO Offset line from appended code
              const start = { line: parseInt(line!, 10), column: 0 };
              return { start, end: start, message: escapeMarkdown(err!) };
            },
          );
          message = message.replaceAll(createRegex(), "");

          // Strip out "No code generated" message, as it's misleading, we aren't generating code here
          message = message.replace("No code generated.", "");
          // Trim excess whitespace
          message = message
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .join("\n");

          // Forward that validation failed
          resolve({
            warnings: [],
            errors: [
              {
                origin: "parcel-validator-glsl",
                message: escapeMarkdown(message),
                codeFrames: [
                  {
                    filePath: asset.filePath,
                    language: asset.type,
                    code,
                    codeHighlights,
                  },
                ],
              },
            ],
          });
        } else {
          // Validation passed, handle any output
          if (stdout) {
            logger.log({
              message: escapeMarkdown(stdout),
            });
          }
          if (stderr) {
            logger.error({
              message: escapeMarkdown(stderr),
            });
          }

          // Forward that validation passed
          resolve();
        }
      });
    });
  },
});
