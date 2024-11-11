import { DiagnosticCodeHighlight, escapeMarkdown } from "@parcel/diagnostic";
import { Asset, ValidateResult } from "@parcel/types";

export function parseValidateResult(
  message: string,
  asset: Asset,
  code: string,
): ValidateResult {
  // Parse errors
  const createErrorRegex = () => /^ERROR: (.+):(\d+): (.+)$/gm;
  const matches = Array.from(message.matchAll(createErrorRegex()));
  let errors: [line: number, message: string][] = matches.map(
    // TODO Offset line from appended code
    ([, , line, err]) => [parseInt(line!, 10), err || "Unknown error"],
  );

  // Merge errors that are on the same line
  errors = errors.reduce(
    (arr, [line, err], index) => {
      if (index > 0) {
        const prevEntry = errors[index - 1]!;
        if (prevEntry[0] === line) {
          prevEntry[1] += "; " + err;
          return arr;
        }
      }
      arr.push([line, err]);
      return arr;
    },
    [] as typeof errors,
  );

  // Convert to Parcel code highlights
  const codeHighlights: DiagnosticCodeHighlight[] = errors.map(
    ([line, err]) => {
      const start = { line, column: 0 };
      return { start, end: start, message: escapeMarkdown(err) };
    },
  );

  // Strip errors out of message, they will be rendered separately
  message = message.replaceAll(createErrorRegex(), "");

  // Strip out "No code generated" message, as it's misleading, we aren't generating code here
  message = message.replace("No code generated.", "");

  // Trim excess whitespace
  message = message
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  // Return parsed message, errors and warnings
  return {
    warnings: [],
    errors: [
      {
        message: escapeMarkdown(message),
        documentationURL:
          "https://www.khronos.org/opengl/wiki/Core_Language_%28GLSL%29",
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
  };
}
