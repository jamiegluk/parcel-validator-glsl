import ThrowableDiagnostic from "@parcel/diagnostic";

export interface Config {
  glslVersion?: number;
  commandArguments?: string;
  threeIntegration?: boolean;
  csmIntegration?: boolean;
}

export const DEFAULT_CONFIG = {
  glslVersion: 130,
  commandArguments: "",
  threeIntegration: false,
  csmIntegration: false,
} as const satisfies Required<Config>;

function configError(arg: string, type: string): never {
  throw new ThrowableDiagnostic({
    diagnostic: {
      message: `parcel-validator-glsl config - ${arg} must be a ${type}`,
    },
  });
}

export function validateConfig(config: Required<Config>): void {
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
