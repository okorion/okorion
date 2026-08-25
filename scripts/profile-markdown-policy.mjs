import { normalizeProfileSurface } from "./profile-surface-normalization.mjs";

function normalizeMarkdownReferenceLabel(value) {
  return normalizeProfileSurface(
    value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~])/gu, "$1"),
  )
    .trim()
    .replace(/\s+/gu, " ");
}

function maskHtmlComments(value) {
  return value.replace(/<!--[\s\S]*?-->/gu, (comment) =>
    comment.replace(/[^\r\n]/gu, " "),
  );
}

function readFenceOpening(line) {
  let cursor = 0;
  while (cursor < 3 && line.at(cursor) === " ") {
    cursor += 1;
  }
  const marker = line.at(cursor);
  if (marker !== "`" && marker !== "~") {
    return null;
  }
  const markerStart = cursor;
  while (line.at(cursor) === marker) {
    cursor += 1;
  }
  const markerLength = cursor - markerStart;
  if (markerLength < 3) {
    return null;
  }
  if (marker === "`" && line.slice(cursor).includes("`")) {
    return null;
  }
  return { marker, markerLength };
}

function isFenceClosing(line, fence) {
  let cursor = 0;
  while (cursor < 3 && line.at(cursor) === " ") {
    cursor += 1;
  }
  const markerStart = cursor;
  while (line.at(cursor) === fence.marker) {
    cursor += 1;
  }
  return cursor - markerStart >= fence.markerLength &&
    line.slice(cursor).trim().length === 0;
}

function maskFencedCode(value) {
  let activeFence = null;
  return value
    .split("\n")
    .map((line) => {
      const comparableLine = line.endsWith("\r") ? line.slice(0, -1) : line;
      if (activeFence) {
        if (isFenceClosing(comparableLine, activeFence)) {
          activeFence = null;
        }
        return "";
      }
      const opening = readFenceOpening(comparableLine);
      if (opening) {
        activeFence = opening;
        return "";
      }
      return line;
    })
    .join("\n");
}

function effectiveMarkdown(value) {
  return maskFencedCode(maskHtmlComments(String(value)));
}

function stripInlineLinkDestinations(value) {
  let output = "";
  let cursor = 0;
  while (cursor < value.length) {
    const destinationStart = value.indexOf("](", cursor);
    if (destinationStart < 0) {
      return output + value.slice(cursor);
    }
    output += value.slice(cursor, destinationStart + 1);
    let destinationCursor = destinationStart + 2;
    let depth = 1;
    for (; destinationCursor < value.length; destinationCursor += 1) {
      const character = value.at(destinationCursor);
      if (character === "\\") {
        destinationCursor += 1;
      } else if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) {
          destinationCursor += 1;
          break;
        }
      } else if (character === "\n" || character === "\r") {
        break;
      }
    }
    if (depth !== 0) {
      return output + value.slice(destinationStart + 1);
    }
    cursor = destinationCursor;
  }
  return output;
}

function stripReferenceLinkLabels(value) {
  return value.replace(/\]\[[^\]\r\n]*\]/gu, "]");
}

function stripReferenceDefinitions(value) {
  return value
    .split("\n")
    .map((line) =>
      /^[ \t]{0,3}\[[^\]\r\n]+\]:/u.test(line) ? "" : line,
    )
    .join("\n");
}

export function canonicalizeGfmVisibleText(content) {
  return stripReferenceLinkLabels(
    stripInlineLinkDestinations(
      stripReferenceDefinitions(effectiveMarkdown(content)).replace(
        /<[^>]*>/gu,
        "",
      ),
    ),
  );
}

function collectMarkdownDefinitions(content) {
  return [...content.matchAll(
    /^[ \t]{0,3}\[([^\]\r\n]+)\]:[ \t]*(?:<([^>\r\n]*)>|([^\s\r\n]+))/gmu,
  )].map(([, rawLabel, bracketedTarget, target]) => ({
    normalizedLabel: normalizeMarkdownReferenceLabel(rawLabel),
    rawLabel,
    target: bracketedTarget ?? target,
  }));
}

function collectMarkdownImageReferences(content) {
  const references = [];
  for (const reference of content.matchAll(
    // eslint-disable-next-line security/detect-unsafe-regex -- Both labels are bounded to one Markdown line and only parsed from repository-sized text surfaces.
    /!\[([^\]\r\n]*)\](?:[ \t]*\[([^\]\r\n]*)\])?/gu,
  )) {
    const [matchedReference, altText, explicitLabel] = reference;
    const followingContent = content.slice(
      (reference.index ?? 0) + matchedReference.length,
    );
    if (/^[ \t]*\(/u.test(followingContent)) {
      continue;
    }
    const rawLabel = explicitLabel === undefined || explicitLabel === ""
      ? altText
      : explicitLabel;
    references.push({
      normalizedLabel: normalizeMarkdownReferenceLabel(rawLabel),
      rawLabel,
    });
  }
  return references;
}

function definitionsByLabel(definitions) {
  const byLabel = new Map();
  for (const definition of definitions) {
    const matches = byLabel.get(definition.normalizedLabel) ?? [];
    matches.push(definition);
    byLabel.set(definition.normalizedLabel, matches);
  }
  return byLabel;
}

export function collectMarkdownImageTargets(content) {
  const renderedMarkdown = effectiveMarkdown(content);
  const targets = [...renderedMarkdown.matchAll(
    /!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/gu,
  )]
    .map(([, bracketedTarget, target]) => bracketedTarget ?? target)
    .filter(Boolean);
  const rawDefinitions = definitionsByLabel(collectMarkdownDefinitions(content));
  const effectiveDefinitions = definitionsByLabel(
    collectMarkdownDefinitions(renderedMarkdown),
  );

  for (const reference of collectMarkdownImageReferences(renderedMarkdown)) {
    const rawMatches = rawDefinitions.get(reference.normalizedLabel) ?? [];
    if (rawMatches.length > 1) {
      throw new Error(
        `duplicate Markdown image reference definition (${reference.rawLabel})`,
      );
    }
    const effectiveMatches = effectiveDefinitions.get(reference.normalizedLabel) ?? [];
    if (effectiveMatches.length !== 1) {
      throw new Error(`unresolved Markdown image reference (${reference.rawLabel})`);
    }
    targets.push(effectiveMatches.at(0).target);
  }
  return targets;
}
