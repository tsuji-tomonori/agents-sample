export type RunAnswer = {
  text: string;
  citations: Array<{
    documentId: string;
    title: string;
    excerpt: string;
  }>;
  confidence: number;
};

export type SimulatedDocumentAccess = {
  documentId: string;
  title: string;
  sourceUri: string;
  snippet: string;
  score: number;
};

export function buildSimulatedDocumentAccesses(
  question: string,
  documentScope?: string
): SimulatedDocumentAccess[] {
  const trimmedQuestion = question.trim();
  const normalizedScope = normalizeOptionalText(documentScope);
  return [
    {
      documentId: 'rag-console-overview',
      title: 'Agentic RAG QA Console overview',
      sourceUri: 'memory://agentic-rag/overview',
      snippet: `Console run context for: ${trimmedQuestion}`,
      score: 0.92
    },
    {
      documentId: 'retrieval-policy',
      title: 'Retrieval and citation policy',
      sourceUri: normalizedScope
        ? `memory://agentic-rag/scopes/${encodeURIComponent(normalizedScope)}`
        : 'memory://agentic-rag/retrieval-policy',
      snippet: normalizedScope
        ? `Scope filter applied: ${normalizedScope}`
        : 'Answers should expose retrieved documents, citations, and runner progress.',
      score: 0.86
    }
  ];
}

export function buildSimulatedAnswer(
  question: string,
  documentAccesses: SimulatedDocumentAccess[]
): RunAnswer {
  return {
    text:
      `Simulated Agentic RAG answer for "${question.trim()}". ` +
      'A real runner can replace this local lifecycle while keeping the run, event, artifact, and document access contract stable.',
    citations: documentAccesses.map((access) => ({
      documentId: access.documentId,
      title: access.title,
      excerpt: access.snippet
    })),
    confidence: 0.72
  };
}

export function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
