import {
  Diagnostic,
  DiagnosticCodeHighlight,
  escapeMarkdown,
} from "@parcel/diagnostic";
import { Asset, ValidateResult } from "@parcel/types";

import { name } from "~/package.json";

function parseCodeHighlightsByRegex(
  createRegex: () => RegExp,
  message: string,
): [codeHighlights: DiagnosticCodeHighlight[], message: string] {
  // Match regex
  const matches = Array.from(message.matchAll(createRegex()));

  // Get issues from regex match groups
  let issues: [line: number, message: string][] = matches.map(
    // TODO Offset line from appended code
    ([, , line, msg]) => [parseInt(line!, 10), msg || "Unknown issue"],
  );

  // Merge issues that are on the same line
  issues = issues.reduce(
    (issues, [line, msg], index) => {
      if (index > 0) {
        const prevEntry = issues[index - 1]!;
        if (prevEntry[0] === line) {
          prevEntry[1] += "; " + msg;
          return issues;
        }
      }
      issues.push([line, msg]);
      return issues;
    },
    [] as typeof issues,
  );

  // Convert to Parcel code highlights
  const codeHighlights: DiagnosticCodeHighlight[] = issues.map(
    ([line, msg]) => {
      const start = { line, column: 0 };
      return { start, end: start, message: escapeMarkdown(msg) };
    },
  );

  // Strip errors out of message, they will be rendered separately
  message = message.replaceAll(createRegex(), "");

  return [codeHighlights, message];
}

function parseDiagnosticByRegex(
  createRegex: () => RegExp,
  message: string,
  asset: Asset,
  code: string,
): Diagnostic | null {
  // Parse issues
  const parsed = parseCodeHighlightsByRegex(createRegex, message);
  const [codeHighlights] = parsed;
  message = parsed[1];

  if (codeHighlights.length === 0) {
    return null;
  }

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
    origin: name,
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
  };
}

export function parseValidateResult(
  message: string,
  asset: Asset,
  code: string,
): ValidateResult {
  // Return parsed message, errors and warnings
  const warning = parseDiagnosticByRegex(
    () => /^WARNING: (.+):(\d+): (.+)$/gm,
    message,
    asset,
    code,
  );
  const error = parseDiagnosticByRegex(
    () => /^ERROR: (.+):(\d+): (.+)$/gm,
    message,
    asset,
    code,
  );
  return {
    warnings: warning ? [warning] : [],
    errors: error ? [error] : [],
  };
}
