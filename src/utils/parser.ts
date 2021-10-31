export function purgeSpaceAndLineBreak(str: string) {
  return str.replaceAll("\n", "").replaceAll(" ", "");
}

export function purgeCurlyBracket(str: string) {
  return str.replaceAll("{", "").replaceAll("}", "");
}

export function parseIncBin(str: string, label: string) {
  const regex = new RegExp(`\\b${label}\\b\\s*\\[?\\s*\\]?\\s*=\\s*INCBIN_[US][0-9][0-9]?\\(\\s*"([^"]*)"\\s*\\)`);
  const match = str.match(regex);
  if (!match) {
    throw Error(`Error parse INCBIN, ${label} is missing.`);
  }
  return {
    path: match[1],
    match: match[0],
  };
}

export function parseCDefines(str: string, prefix = "") {
  const regex = new RegExp(`#define\\s+(${prefix}\\w+)[^\\S\\n]+(.+)`, "g");
  return [...str.matchAll(regex)].map((h) => ({
    symbol: h[1],
    value: h[2],
    match: h[0],
  }));
}

export function parseObjectEventGfxMk(str: string, path: string) {
  path = path.replace("graphics/object_events/pics", "\\$\\(OBJEVENTGFXDIR\\)");
  const regex = new RegExp(
    `${path}([^:]*):\\s*%\\.(\\b\\w*\\b):\\s*%\\.(\\b\\w*\\b)\\n\\s*\\$\\(GFX\\)\\s*\\$<\\s*\\$@\\s*-mwidth\\s*(\\b\\d*\\b)\\s*-mheight\\s*(\\b\\d*\\b)`,
    "g"
  );
  console.log(regex);
  return [...str.matchAll(regex)].map((h) => ({
    path: h[1],
    out: h[2],
    in: h[3],
    mWidth: h[4],
    mHeight: h[5],
    match: h[0],
  }));
}

export function parseCObjectArray(str: string, label: string) {
  const regex = new RegExp(`\\b${label}\\b\\s*(\\[?[^\\]]*\\])?\\s*=\\s*\\{([^;]*)};`);
  const match = str.match(regex);
  if (!match) {
    throw Error(`${label} not found.`);
  }
  return {
    body: match[2],
    volume: match[1],
    match: match[0],
  };
}

export function parseCIndexedObjectArray(str: string, label: string) {
  const regex = new RegExp(`\\b${label}\\b\\s*(\\[?[^\\]]*\\])?\\s*=\\s*\\{([^;]*)};`, "g");
  const match = str.match(regex)?.[0];
  if (!match) {
    throw Error(`${label} not found`);
  }

  const arrRegex = /\[([A-Za-z0-9_]*)\]=(&?[A-Za-z0-9_]*)/g;

  return {
    match,
    items: [...match.replaceAll(" ", "").matchAll(arrRegex)].map((h) => ({
      value: h[2],
      index: h[1],
    })),
  };
}

export function parseCObject(str: string, label: string) {
  const regex = new RegExp(`${label}\\s*=\\s*{([^}]*)};`, "g");
  return [...str.matchAll(regex)].map((h) => ({
    value: h[1],
    match: h[0],
  }));
}
