import {
  Diagnostic,
  DiagnosticCodeHighlight,
  escapeMarkdown,
} from "@parcel/diagnostic";
import { Asset, ValidateResult } from "@parcel/types";
import regexEscape from "regex-escape";

import { name } from "~/package.json";

/**
 * Parses the output of the `gslangValidator` command into
 * a list of Parcel validator {@link DiagnosticCodeHighlight}s for just warnings *or* errors.
 * @param createRegex Function creating a regular expression to match the issues (warnings *or* errors) in the output.
 * @param mainMessage Output of `gslangValidator` command (`stdout` and `stderr` joined).
 * @param lineOffset Count of lines that were injected into the code.
 * @returns Tuple of:
 *   1. Parcel validator {@link DiagnosticCodeHighlight} with parsed issues (warnings *or* errors).
 *   2. Parsed message, with above highlighted code issues removed.
 */
function parseCodeHighlightsByRegex(
  createRegex: () => RegExp,
  mainMessage: string,
  lineOffset: number,
): [codeHighlights: DiagnosticCodeHighlight[], message: string] {
  // Match regex
  const matches = Array.from(mainMessage.matchAll(createRegex()));

  // Get issues from regex match groups
  let issues: { line: number; message: string }[] = matches.map(
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

/**
 * Parses the output of the `gslangValidator` command into
 * a Parcel validator {@link Diagnostic} for just warnings *or* errors.
 * @param createRegex Function creating a regular expression to match the issues (warnings *or* errors) in the output.
 * @param message Output of `gslangValidator` command (`stdout` and `stderr` joined).
 * @param asset Parcel asset.
 * @param code Original asset code, without additional code injected.
 * @param filePath File path of the temporary modified asset, or the original asset if no code was injected.
 * @param lineOffset Count of lines that were injected into the code.
 * @returns Parcel validator {@link Diagnostic} with parsed message and issues.
 */
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

/**
 * Parses the output of the `gslangValidator` command into
 * a Parcel validator {@link ValidateResult}.
 * @param message Output of `gslangValidator` command (`stdout` and `stderr` joined).
 * @param asset Parcel asset.
 * @param code Original asset code, without additional code injected.
 * @param filePath File path of the temporary modified asset, or the original asset if no code was injected.
 * @param lineOffset Count of lines that were injected into the code.
 * @returns Parcel validator {@link ValidateResult} with parsed message, errors and warnings.
 */
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
