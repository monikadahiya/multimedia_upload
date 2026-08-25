/**
 * Small Levenshtein-distance based fuzzy matcher, used as a fallback when
 * MongoDB's $text search returns no results (e.g. the user made a typo).
 * No external dependencies — cheap enough to run over a single user's file
 * list, which is already small per-request.
 */

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// Returns a 0..1 similarity score (1 = identical) between two strings.
function similarity(a, b) {
  const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - distance / maxLen;
}

// Checks a query against a file's name/tags/description and returns the
// best similarity score found across fields, plus which field matched best.
// threshold filters out weak matches (default 0.6 = fairly close typo).
function fuzzyScoreFile(file, query, threshold = 0.6) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  const candidates = [
    file.fileName || "",
    ...(file.tags || []),
    file.description || "",
  ];

  let best = 0;
  for (const candidate of candidates) {
    // Compare against whole words, not just the full string, so a typo in
    // one word of a longer file name still matches well.
    const words = candidate.toLowerCase().split(/\s+/);
    for (const word of [candidate, ...words]) {
      if (!word) continue;
      const score = similarity(q, word);
      if (score > best) best = score;
    }
  }

  return best >= threshold ? best : 0;
}

module.exports = { levenshtein, similarity, fuzzyScoreFile };
