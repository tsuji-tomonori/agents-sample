import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isTerminal,
  normalizeEvents,
  normalizeRun,
  normalizeStatus,
  statusLabel
} from './app.utils';

describe('agent console normalization', () => {
  it('normalizes backend completed runs into succeeded UI state', () => {
    const run = normalizeRun(
      {
        run: {
          id: 'run-1',
          status: 'completed',
          question: 'What changed?',
          documentScope: 'docs/spec',
          answer: {
            text: 'Final answer',
            citations: [
              {
                documentId: 'doc-1',
                title: 'Overview',
                excerpt: 'Evidence'
              }
            ]
          },
          artifacts: [
            {
              id: 'artifact-1',
              kind: 'trace',
              title: 'Trace',
              content: '{}'
            }
          ],
          documentAccesses: [
            {
              documentId: 'doc-1',
              title: 'Overview',
              sourceUri: 'memory://doc',
              snippet: 'Evidence',
              score: 0.9
            }
          ]
        }
      },
      {
        fallbackQuestion: 'fallback',
        fallbackDocumentScope: 'fallback-scope'
      }
    );

    assert.equal(run.id, 'run-1');
    assert.equal(run.status, 'succeeded');
    assert.equal(run.documentScope, 'docs/spec');
    assert.equal(run.answer, 'Final answer');
    assert.deepEqual(run.citations[0], {
      id: 'doc-1',
      title: 'Overview',
      source: undefined,
      excerpt: 'Evidence',
      url: undefined
    });
    assert.equal(run.artifacts[0].name, 'Trace');
    assert.equal(run.artifacts[0].type, 'trace');
    assert.equal(run.documentAccesses[0].reason, 'Evidence');
  });

  it('preserves previous timeline events when the response has no events', () => {
    const previous = [
      {
        id: 'event-1',
        at: '2026-07-06T00:00:00.000Z',
        label: 'run.created',
        status: 'queued' as const
      }
    ];

    assert.equal(normalizeEvents({ events: [] }, previous), previous);
  });

  it('normalizes event labels, timestamps, and statuses', () => {
    const events = normalizeEvents(
      {
        events: [
          {
            type: 'run.completed',
            createdAt: '2026-07-06T00:00:02.000Z',
            status: 'completed',
            message: 'Done'
          }
        ]
      },
      []
    );

    assert.equal(events[0].label, 'run.completed');
    assert.equal(events[0].at, '2026-07-06T00:00:02.000Z');
    assert.equal(events[0].status, 'succeeded');
    assert.equal(events[0].detail, 'Done');
  });

  it('maps status helpers for terminal states', () => {
    assert.equal(normalizeStatus('completed'), 'succeeded');
    assert.equal(normalizeStatus('error'), 'failed');
    assert.equal(isTerminal('succeeded'), true);
    assert.equal(isTerminal('running'), false);
    assert.equal(statusLabel('queued'), 'Queued');
  });
});
