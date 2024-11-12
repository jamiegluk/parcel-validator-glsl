import ThrowableDiagnostic from "@parcel/diagnostic";

/**
 * Plugin configuration from
 * `parcel-validator-glsl.config.json` (or `.js`).
 */
export interface Config {
  /**
   * Exclude files from validation.
   * This is an array of file GLOB patterns.
   */
  exclude?: string[];
  /**
   * Default GLSL version to validate files with.
   * `#version` directives will override this.
   * @see https://www.khronos.org/opengl/ wiki/Core_Language_(GLSL)#Version
   */
  glslVersion?: number;
  /**
   * Additional `glslangValidator` command line options and arguments.
   * @see https://manpages.debian.org/bullseye/glslang-tools/glslangValidator.1.en.html
   */
  commandArguments?: string;
  /**
   * Injects definitions for Three.js uniforms and attributes into validated code,
   * unless a `// parcel-validator-glsl no-three` comment is present anywhere in the file.
   * @see https://threejs.org/docs/index.html#api/en/renderers/webgl/WebGLProgram
   */
  threeIntegration?: boolean;
  /**
   * Injects definitions for Three-CustomShaderMaterial output variables into validated code,
   * unless a `// parcel-validator-glsl no-csm` comment is present anywhere in the file.
   * @see https://github.com/FarazzShaikh/THREE-CustomShaderMaterial?tab=readme-ov-file#output-variables
   */
  csmIntegration?: boolean;
}

/**
 * Default values for {@link Config}.
 */
export const DEFAULT_CONFIG = {
  exclude: [],
  glslVersion: 110,
  commandArguments: "",
  threeIntegration: false,
  csmIntegration: false,
} as const satisfies Required<Config>;

/**
 * Throws a {@link ThrowableDiagnostic} error due to a {@link Config}
 * property having an incorrect type.
 * @param key Property name.
 * @param type Expected type.
 */
function configError(key: string, type: string): never {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: `parcel-validator-glsl config - ${key} must be a ${type}`,
    },
  });
}

/**
 * Validates a loaded {@link Config} has properties of the correct types.
 * @param config The plugin config.
 * @throws An {@link ThrowableDiagnostic} error if any property is invalid.
 */
export function validateConfig(config: Required<Config>): void {
  if (
    !Array.isArray(config.exclude) ||
    config.exclude.some((x) => typeof x !== "string")
  ) {
    configError("exclude", "string[]");
  }
  if (typeof config.commandArguments !== "string") {
    configError("commandArguments", "string");
  }
  if (typeof config.glslVersion !== "number") {
    configError("glslVersion", "number");
  }
  if (typeof config.threeIntegration !== "boolean") {
    configError("threeIntegration", "boolean");
  }
  if (typeof config.csmIntegration !== "boolean") {
    configError("csmIntegration", "boolean");
  }
}
