function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return text.replace(/[&<>"]/g, (ch) => map[ch]);
}

function formatInline(text) {
  const escaped = escapeHtml(text);
  const parts = escaped.split(/(\*\*.*?\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return `<strong>${part.slice(2, -2)}</strong>`;
    }
    return part.replace(/\n/g, "<br />");
  }).join("");
}

export function formatMessage(text) {
  if (!text) return [];

  const blocks = text.split(/\n\s*\n/);
  const elements = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n").filter((l) => l.trim());

    const bulletLines = lines.filter((l) => /^[-*]\s/.test(l));
    const numberedLines = lines.filter((l) => /^\d+[.)]\s/.test(l));

    if (bulletLines.length === lines.length && lines.length > 0) {
      const items = lines.map((l) => `<li>${formatInline(l.replace(/^[-*]\s/, ""))}</li>`).join("");
      elements.push(`<ul>${items}</ul>`);
    } else if (numberedLines.length === lines.length && lines.length > 1) {
      const items = lines.map((l) => `<li>${formatInline(l.replace(/^\d+[.)]\s/, ""))}</li>`).join("");
      elements.push(`<ol>${items}</ol>`);
    } else {
      elements.push(`<p>${formatInline(trimmed)}</p>`);
    }
  }

  return elements;
}
