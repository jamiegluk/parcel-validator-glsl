import {
  Diagnostic,
  DiagnosticCodeHighlight,
  escapeMarkdown,
} from "@parcel/diagnostic";
import { Asset, ValidateResult } from "@parcel/types";
import regexEscape from "regex-escape";

import { name } from "~/package.json";

function parseCodeHighlightsByRegex(
  createRegex: () => RegExp,
  mainMessage: string,
  lineOffset: number,
): [codeHighlights: DiagnosticCodeHighlight[], message: string] {
  // Match regex
  const matches = Array.from(mainMessage.matchAll(createRegex()));

  // Get issues from regex match groups
  let issues: { line: number; message: string }[] = matches.map(
    // TODO Offset line from appended code
    ([, , line, message]) => ({
      line: parseInt(line!, 10) - lineOffset,
      message: message || "Unknown issue",
    }),
  );

  // Merge issues that are on the same line
  issues = issues.reduce(
    (issues, { line, message }) => {
      if (issues.length > 0) {
        const prevEntry = issues[issues.length - 1]!;
        if (prevEntry.line === line) {
          prevEntry.message += "; " + message;
          return issues;
        }
      }
      issues.push({ line, message });
      return issues;
    },
    [] as typeof issues,
  );

  // Convert to Parcel code highlights
  const codeHighlights: DiagnosticCodeHighlight[] = issues.map(
    ({ line, message }) => {
      const start = { line, column: 0 };
      return { start, end: start, message: escapeMarkdown(message) };
    },
  );

  // Strip errors out of message, they will be rendered separately
  mainMessage = mainMessage.replaceAll(createRegex(), "");

  return [codeHighlights, mainMessage];
}

function parseDiagnosticByRegex(
  createRegex: () => RegExp,
  message: string,
  asset: Asset,
  code: string,
  filePath: string,
  lineOffset: number,
): Diagnostic | null {
  // Parse issues
  const parsed = parseCodeHighlightsByRegex(createRegex, message, lineOffset);
  const [codeHighlights] = parsed;
  message = parsed[1];

  if (codeHighlights.length === 0) {
    return null;
  }

  // Strip out "No code generated" message, as it's misleading, we aren't generating code here
  message = message.replace("No code generated.", "");

  // Strip out file path from message, as code highlights contain it already
  message = message.replaceAll(
    new RegExp(`^${regexEscape(filePath)}$`, "gm"),
    "",
  );

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
  filePath: string,
  lineOffset: number,
): ValidateResult {
  // Return parsed message, errors and warnings
  const warning = parseDiagnosticByRegex(
    () => /^WARNING: (.+):(\d+): (.+)$/gm,
    message,
    asset,
    code,
    filePath,
    lineOffset,
  );
  const error = parseDiagnosticByRegex(
    () => /^ERROR: (.+):(\d+): (.+)$/gm,
    message,
    asset,
    code,
    filePath,
    lineOffset,
  );
  return {
    warnings: warning ? [warning] : [],
    errors: error ? [error] : [],
  };
}
