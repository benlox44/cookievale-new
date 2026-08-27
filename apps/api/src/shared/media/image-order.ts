/** Unreferenced uploads are appended so a malformed order can't lose them. */
export function buildImageOrder(
  imageOrder: string,
  currentUrls: string[],
  newUrls: string[],
): string[] {
  let tokens: unknown;
  try {
    tokens = JSON.parse(imageOrder);
  } catch {
    return [];
  }
  if (!Array.isArray(tokens)) {
    return [];
  }

  const validCurrent = new Set(currentUrls);
  const ordered: string[] = [];

  for (const token of tokens) {
    if (typeof token !== "string") {
      continue;
    }
    if (token.startsWith("new:")) {
      const indexStr = token.slice(4);
      if (!/^\d+$/.test(indexStr)) {
        continue;
      }
      const index = Number(indexStr);
      if (index < newUrls.length && !ordered.includes(newUrls[index])) {
        ordered.push(newUrls[index]);
      }
    } else if (validCurrent.has(token) && !ordered.includes(token)) {
      ordered.push(token);
    }
  }

  for (const url of newUrls) {
    if (!ordered.includes(url)) {
      ordered.push(url);
    }
  }

  return ordered;
}
