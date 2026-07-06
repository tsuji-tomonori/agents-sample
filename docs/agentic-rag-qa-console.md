# Agentic RAG QA Console MVP

This document defines the smallest durable contract for the Agentic RAG QA Console MVP. It is contract support only; it does not imply that AppSync subscriptions, S3 persistence, or a production runner are implemented.

## Concepts

An Agentic RAG run is one question-answer workflow. The run owns the question, lifecycle status, final answer, citations, emitted events, and generated artifacts.

A run event is an ordered progress record for one run. Events are used by the console to render status updates while planning, retrieval, answer generation, artifact creation, completion, or failure occurs.

An artifact is an output or supporting payload associated with a run. MVP artifacts can include the final answer and a local simulated runner trace. In the local MVP, artifacts may be inline records rather than S3 objects.

## API Contract

### `POST /api/runs`

Creates a run for a user question.

Request:

```json
{
  "question": "What changed in the latest architecture notes?",
  "documentScope": "docs/spec"
}
```

Response: `201 Created`

```json
{
  "run": {
    "id": "f1c58a65-3a19-4f72-91f1-c22b0d7d9b18",
    "status": "completed",
    "question": "What changed in the latest architecture notes?",
    "documentScope": "docs/spec",
    "answer": {
      "text": "Simulated Agentic RAG answer for \"What changed in the latest architecture notes?\".",
      "citations": [
        {
          "documentId": "rag-console-overview",
          "title": "Agentic RAG QA Console overview",
          "excerpt": "Console run context for: What changed in the latest architecture notes?"
        }
      ],
      "confidence": 0.72
    },
    "createdAt": "2026-07-06T00:00:00.000Z",
    "updatedAt": "2026-07-06T00:00:02.000Z",
    "completedAt": "2026-07-06T00:00:02.000Z",
    "events": [],
    "artifacts": [],
    "documentAccesses": []
  }
}
```

### `GET /api/runs/{id}`

Returns the current run state.

Response: `200 OK`

```json
{
  "run": {
    "id": "f1c58a65-3a19-4f72-91f1-c22b0d7d9b18",
    "status": "completed",
    "question": "What changed in the latest architecture notes?",
    "documentScope": "docs/spec",
    "createdAt": "2026-07-06T00:00:00.000Z",
    "updatedAt": "2026-07-06T00:00:02.000Z",
    "completedAt": "2026-07-06T00:00:02.000Z",
    "answer": {
      "text": "Simulated Agentic RAG answer for \"What changed in the latest architecture notes?\".",
      "citations": [
        {
          "documentId": "rag-console-overview",
          "title": "Agentic RAG QA Console overview",
          "excerpt": "Console run context for: What changed in the latest architecture notes?"
        }
      ],
      "confidence": 0.72
    },
    "events": [
      {
        "id": "5fd7c331-8409-4e6d-b99e-a064d145166d",
        "runId": "f1c58a65-3a19-4f72-91f1-c22b0d7d9b18",
        "type": "run.completed",
        "message": "Answer synthesized successfully.",
        "status": "completed",
        "createdAt": "2026-07-06T00:00:02.000Z"
      }
    ],
    "artifacts": [
      {
        "id": "63101118-f265-4736-bb47-4e3d68a04104",
        "runId": "f1c58a65-3a19-4f72-91f1-c22b0d7d9b18",
        "kind": "answer",
        "title": "Final answer",
        "content": "Simulated Agentic RAG answer.",
        "createdAt": "2026-07-06T00:00:02.000Z"
      }
    ],
    "documentAccesses": []
  }
}
```

### `GET /api/runs/{id}/events`

Returns ordered run events.

Response: `200 OK`

```json
{
  "events": [
    {
      "id": "5fd7c331-8409-4e6d-b99e-a064d145166d",
      "runId": "f1c58a65-3a19-4f72-91f1-c22b0d7d9b18",
      "type": "run.completed",
      "message": "Answer synthesized successfully.",
      "status": "completed",
      "createdAt": "2026-07-06T00:00:02.000Z"
    }
  ]
}
```

## Status And Event Types

Run status values:

- `queued`
- `running`
- `completed`
- `failed`

Initial event types:

- `run.created`
- `planner.started`
- `retrieval.completed`
- `run.completed`
- `run.failed`

## Placeholder Boundaries

The local MVP may simulate asynchronous execution in-process. AppSync subscriptions, S3 artifact persistence, and a separate runner service are placeholders unless their implementation exists in source.

Clients should depend on the HTTP JSON contract above, not on the placeholder transport or storage backing it.
