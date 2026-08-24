function decodeCssEscapes(value) {
  return value.replace(
    /\\(?:\r\n|[\n\r\f])|\\([0-9a-f]{1,6})[\t\n\f\r ]?|\\([^\n\r\f])/giu,
    (_, hexadecimal, simpleEscape) => {
      if (hexadecimal) {
        const codePoint = Number.parseInt(hexadecimal, 16);
        return codePoint > 0 && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : "";
      }
      return simpleEscape ?? "";
    },
  );
}

function stripCssComments(value) {
  return value.replace(/\/\*[\s\S]*?\*\//gu, "");
}

function stripHtmlComments(value) {
  return value.replace(/<!--[\s\S]*?-->/gu, "");
}

// eslint-disable-next-line xss/no-mixed-html -- Values are scalar canonicalization tokens, never HTML output or DOM input.
const namedHtmlEntityReplacements = new Map([
  ["amp", "\u0026"],
  ["backslash", "\\"],
  ["bsol", "\\"],
  ["colon", ":"],
  ["hyphen", "-"],
  ["newline", "\n"],
  ["nbsp", "\u00a0"],
  ["period", "."],
  ["sol", "/"],
  ["tab", "\t"],
]);

function decodeNumericHtmlEntity(rawValue, radix) {
  const codePoint = Number.parseInt(rawValue, radix);
  return codePoint > 0 &&
    codePoint <= 0x10ffff &&
    !(codePoint >= 0xd800 && codePoint <= 0xdfff)
    ? String.fromCodePoint(codePoint)
    : "\ufffd";
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);?/giu, (_, hexadecimal) =>
      decodeNumericHtmlEntity(hexadecimal, 16),
    )
    .replace(/&#(\d+);?/gu, (_, decimal) =>
      decodeNumericHtmlEntity(decimal, 10),
    )
    .replace(/&([a-z][a-z0-9]+);/giu, (_, entityName) =>
      namedHtmlEntityReplacements.get(
        entityName.toLocaleLowerCase("en-US"),
      ) ?? "\ufffd",
    );
}

function decodeUrlLayers(value) {
  let decoded = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

export function normalizeProfileSurface(value) {
  let normalized = String(value);
  for (let layer = 0; layer < 6; layer += 1) {
    const next = decodeCssEscapes(
      decodeHtmlEntities(
        decodeUrlLayers(stripHtmlComments(stripCssComments(normalized))),
      ),
    )
      .replace(/\p{Cf}/gu, "")
      .normalize("NFKC");
    if (next === normalized) {
      break;
    }
    normalized = next;
  }
  return normalized.toLocaleLowerCase("en-US");
}
