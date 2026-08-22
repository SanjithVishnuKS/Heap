import test from 'node:test';
import assert from 'node:assert/strict';

function scoreThought(text, query) {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const haystack = text.toLowerCase();
  return words.reduce((score, word) => score + (haystack.includes(word) ? 3 : 0), 0) + (haystack.includes(query.toLowerCase()) ? 4 : 0);
}

function exportText(thoughts) {
  return `Heap export\n\n${thoughts.map(thought => `${thought.createdAt}\n${thought.text}`).join('\n\n')}`;
}

function isNudgeEligible(createdAt, now) {
  return now - new Date(createdAt).getTime() >= 7 * 24 * 60 * 60 * 1000;
}

test('retrieval scores multiple words independently', () => {
  assert.ok(scoreThought('Ask Maya about the contractor recommendation', 'Maya contractor') > 0);
  assert.equal(scoreThought('A note about coffee', 'Maya contractor'), 0);
});

test('export includes every thought in order', () => {
  const output = exportText([{ createdAt: '2026-08-22T10:00:00.000Z', text: 'First thought' }, { createdAt: '2026-08-21T10:00:00.000Z', text: 'Second thought' }]);
  assert.match(output, /Heap export/);
  assert.ok(output.indexOf('First thought') < output.indexOf('Second thought'));
});

test('weekly reminder only selects thoughts at least seven days old', () => {
  const now = Date.parse('2026-08-22T12:00:00.000Z');
  assert.equal(isNudgeEligible('2026-08-15T11:59:59.000Z', now), true);
  assert.equal(isNudgeEligible('2026-08-15T12:00:01.000Z', now), false);
});
