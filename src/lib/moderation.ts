const suspiciousTerms = [
  "pay before inspection",
  "deposit first",
  "send momo first",
  "full payment before",
  "no inspection",
  "urgent investment",
  "free money",
];

export function scanListingText(text: string) {
  const lowered = text.toLowerCase();
  const matches = suspiciousTerms.filter((term) => lowered.includes(term));

  return {
    flagged: matches.length > 0,
    matches,
  };
}

