const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", copy: "©", reg: "®", trade: "™",
};

/** Turns &#8217;, &amp; and friends into the characters they stand for. */
export function decodeEntities(value = "") {
  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (whole, dec?: string, hex?: string, name?: string) => {
    if (dec || hex) {
      const code = dec ? Number(dec) : parseInt(hex as string, 16);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED_ENTITIES[(name as string).toLowerCase()] ?? whole;
  });
}

export function stripHtml(value = "") {
  return decodeEntities(value.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

export function calculateReadingTime(content = ""): string {
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function formatIndianDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

