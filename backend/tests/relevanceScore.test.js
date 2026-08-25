const { computeRelevance } = require('../utils/relevanceScore');

describe('computeRelevance', () => {
  const baseFile = (overrides = {}) => ({
    viewCount: 0,
    createdAt: new Date(),
    ...overrides,
  });

  test('a strong text match outranks a weak one, all else equal', () => {
    const strong = computeRelevance(baseFile(), { textScore: 5 });
    const weak = computeRelevance(baseFile(), { textScore: 1 });
    expect(strong).toBeGreaterThan(weak);
  });

  test('more views increases score when text scores are equal', () => {
    const popular = computeRelevance(baseFile({ viewCount: 1000 }), { textScore: 1 });
    const unpopular = computeRelevance(baseFile({ viewCount: 1 }), { textScore: 1 });
    expect(popular).toBeGreaterThan(unpopular);
  });

  test('a more recent file scores higher when other signals are equal', () => {
    const recent = computeRelevance(baseFile({ createdAt: new Date() }), { textScore: 1 });
    const old = computeRelevance(
      baseFile({ createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000) }),
      { textScore: 1 }
    );
    expect(recent).toBeGreaterThan(old);
  });

  test('custom weights shift the ranking toward popularity', () => {
    const scoreDefault = computeRelevance(baseFile({ viewCount: 500 }), { textScore: 0.1 });
    const scorePopularityWeighted = computeRelevance(baseFile({ viewCount: 500 }), {
      textScore: 0.1,
      weights: { text: 0.1, popularity: 0.8, recency: 0.1 },
    });
    expect(scorePopularityWeighted).toBeGreaterThan(scoreDefault);
  });
});
