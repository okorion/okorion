import { normalizeProfileSurface } from "./profile-surface-normalization.mjs";

const markdownEscapablePunctuation = new Set(
  [..."!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"],
);
const fenceMarkers = new Set(["`", "~"]);
const markdownLineBreaks = new Set(["\n", "\r"]);
const markdownImageReferencePattern =
  // eslint-disable-next-line security/detect-unsafe-regex -- Both labels are bounded to one Markdown line and only parsed from repository-sized text surfaces.
  /!\[([^\]\r\n]*)\](?:[ \t]*\[([^\]\r\n]*)\])?/gu;
const inlineImageDestinationPrefixPattern = /^[ \t]*\(/u;

function decodeMarkdownEscapes(value) {
  let decoded = "";
  for (let cursor = 0; cursor < value.length; cursor += 1) {
    const character = value.at(cursor);
    const nextCharacter = value.at(cursor + 1);
    if (character === "\\" && markdownEscapablePunctuation.has(nextCharacter)) {
      decoded += nextCharacter;
      cursor += 1;
    } else {
      decoded += character;
    }
  }
  return decoded;
}

function normalizeMarkdownReferenceLabel(value) {
  return normalizeProfileSurface(decodeMarkdownEscapes(value))
    .trim()
    .replace(/\s+/gu, " ");
}

function maskHtmlComments(value) {
  return value.replace(/<!--[\s\S]*?-->/gu, (comment) =>
    comment.replace(/[^\r\n]/gu, " "),
  );
}

function leadingSpaceEnd(line) {
  let cursor = 0;
  while (cursor < 3 && line.at(cursor) === " ") {
    cursor += 1;
  }
  return cursor;
}

function markerRunLength(line, markerStart, marker) {
  let cursor = markerStart;
  while (line.at(cursor) === marker) {
    cursor += 1;
  }
  return cursor - markerStart;
}

function readFenceOpening(line) {
  const markerStart = leadingSpaceEnd(line);
  const marker = line.at(markerStart);
  if (!fenceMarkers.has(marker)) {
    return null;
  }
  const markerLength = markerRunLength(line, markerStart, marker);
  const infoStart = markerStart + markerLength;
  if (markerLength < 3) {
    return null;
  }
  if (marker === "`" && line.slice(infoStart).includes("`")) {
    return null;
  }
  return { marker, markerLength };
}

function isFenceClosing(line, fence) {
  const markerStart = leadingSpaceEnd(line);
  const markerLength = markerRunLength(line, markerStart, fence.marker);
  return markerLength >= fence.markerLength &&
    line.slice(markerStart + markerLength).trim().length === 0;
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

function markdownDestinationEnd(value, cursor) {
  let depth = 1;
  while (cursor < value.length) {
    const character = value.at(cursor);
    if (character === "\\") {
      cursor += 2;
      continue;
    }
    if (markdownLineBreaks.has(character)) {
      return null;
    }
    depth += Number(character === "(");
    depth -= Number(character === ")");
    cursor += 1;
    if (depth === 0) {
      return cursor;
    }
  }
  return null;
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
    const destinationEnd = markdownDestinationEnd(value, destinationStart + 2);
    if (destinationEnd === null) {
      return output + value.slice(destinationStart + 1);
    }
    cursor = destinationEnd;
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

function markdownImageReferenceLabel(reference, content) {
  const [matchedReference, altText, explicitLabel] = reference;
  const followingContent = content.slice(
    (reference.index ?? 0) + matchedReference.length,
  );
  if (inlineImageDestinationPrefixPattern.test(followingContent)) {
    return null;
  }
  return explicitLabel ? explicitLabel : altText;
}

function collectMarkdownImageReferences(content) {
  const references = [];
  for (const reference of content.matchAll(markdownImageReferencePattern)) {
    const rawLabel = markdownImageReferenceLabel(reference, content);
    if (rawLabel === null) {
      continue;
    }
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
