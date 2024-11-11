import { Validator } from "@parcel/plugin";
import ThrowableDiagnostic, { md as _md } from "@parcel/diagnostic";
import { exec } from "child_process";
import { createRequire } from "module";

// Fix md typings
const md = _md as unknown as (
  template: TemplateStringsArray,
  ...params: any[]
) => string;

// Workaround https://github.com/parcel-bundler/parcel/issues/6925#issuecomment-1003935487
const req = createRequire(__dirname);

/**
 * Parcel optimizer plugin to remove the #version directive from GLSL files.
 */
export default new Validator({
  async validate({ asset, logger }) {
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

    // Add standard arguments and options
    const cmd = `"${validator}" -l -DVALIDATE "${asset.filePath}"`;

    // Run the glslValidator command and handle the output
    return new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          const message =
            stdout || stderr
              ? ["GLSL Validation failed", stdout, stderr].join("\n")
              : error.message || "Unknown error";
          reject(
            new ThrowableDiagnostic({
              diagnostic: {
                message: message,
              },
            }),
          );
        } else {
          if (stdout) {
            logger.log({
              message: md`${stdout}`,
            });
          }
          if (stderr) {
            logger.error({
              message: md`${stderr}`,
            });
          }
        }

        resolve();
      });
    });
  },
});
