import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSimulatedAnswer,
  buildSimulatedDocumentAccesses,
  normalizeOptionalText
} from './runs.js';

describe('run simulation helpers', () => {
  it('normalizes optional text by trimming empty scope values to null', () => {
    assert.equal(normalizeOptionalText('  docs/spec  '), 'docs/spec');
    assert.equal(normalizeOptionalText('   '), null);
    assert.equal(normalizeOptionalText(undefined), null);
  });

  it('applies document scope to simulated retrieval metadata', () => {
    const accesses = buildSimulatedDocumentAccesses('  要約して  ', ' docs/spec ');

    assert.equal(accesses.length, 2);
    assert.equal(accesses[0].snippet, 'Console run context for: 要約して');
    assert.equal(accesses[1].sourceUri, 'memory://agentic-rag/scopes/docs%2Fspec');
    assert.equal(accesses[1].snippet, 'Scope filter applied: docs/spec');
  });

  it('builds answer citations from the document accesses', () => {
    const accesses = buildSimulatedDocumentAccesses('What changed?');
    const answer = buildSimulatedAnswer(' What changed? ', accesses);

    assert.match(answer.text, /Simulated Agentic RAG answer for "What changed\?"/);
    assert.equal(answer.confidence, 0.72);
    assert.deepEqual(
      answer.citations.map((citation) => citation.documentId),
      accesses.map((access) => access.documentId)
    );
  });
});
