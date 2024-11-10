import { Validator } from "@parcel/plugin";
import ThrowableDiagnostic from "@parcel/diagnostic";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Parcel optimizer plugin to remove the #version directive from GLSL files.
 */
export default new Validator({
  async validate({ asset, logger }) {
    // Get OS independent path to validator
    let validator =
      "./node_modules/glslang-validator-prebuilt-predownloaded/bin/";
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
    validator = require.resolve(validator);

    // Add standard arguments and options
    const cmd = `"${validator}" -l -Dvalidate "${asset.filePath}"`;

    try {
      const { stdout, stderr } = await execAsync(cmd);

      if (stdout) {
        logger.log({
          message: stdout,
        });
      }
      if (stderr) {
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: stderr,
          },
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e?.toString() ?? "Unknown");
      throw new ThrowableDiagnostic({
        diagnostic: {
          message: msg,
        },
      });
    }
  },
});
