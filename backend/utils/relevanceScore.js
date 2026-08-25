/**
 * Computes a composite relevance score for a search result.
 *
 * Combines three signals so results aren't ranked by a single naive metric:
 *  - textScore: MongoDB's $text relevance score (keyword match strength in
 *    fileName / tags / description, weighted in the schema's text index)
 *  - popularity: log-scaled view count, so a handful of extra views doesn't
 *    dominate a strong keyword match
 *  - recency: exponential decay favoring recently uploaded files
 *
 * Weights are tunable via the `weights` param so ranking behavior can be
 * adjusted without touching the query logic.
 */
function computeRelevance(file, { textScore = 0, weights = {} } = {}) {
  const w = { text: 0.6, popularity: 0.25, recency: 0.15, ...weights };

  const popularityScore = Math.log10((file.viewCount || 0) + 1);

  const ageInDays = (Date.now() - new Date(file.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.exp(-ageInDays / 30); // half-life-ish decay over ~30 days

  return (
    w.text * textScore +
    w.popularity * popularityScore +
    w.recency * recencyScore
  );
}

module.exports = { computeRelevance };
