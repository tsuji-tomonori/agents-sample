export type RunStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export type Citation = {
  id?: string;
  documentId?: string;
  title?: string;
  source?: string;
  excerpt?: string;
  url?: string;
};

export type Artifact = {
  id?: string;
  name?: string;
  title?: string;
  type?: string;
  kind?: string;
  content?: string;
  url?: string;
};

export type DocumentAccess = {
  id?: string;
  documentId?: string;
  title?: string;
  action?: string;
  status?: string;
  reason?: string;
  sourceUri?: string;
  snippet?: string;
  score?: number;
};

export type TimelineEvent = {
  id: string;
  at: string;
  label: string;
  status: RunStatus;
  detail?: string;
};

export type AgentRun = {
  id: string;
  status: RunStatus;
  question: string;
  documentScope?: string;
  answer?: string;
  createdAt?: string;
  updatedAt?: string;
  citations: NormalizedCitation[];
  artifacts: NormalizedArtifact[];
  documentAccesses: NormalizedDocumentAccess[];
};

export type NormalizedCitation = Required<Pick<Citation, 'id' | 'title'>> &
  Pick<Citation, 'source' | 'excerpt' | 'url'>;

export type NormalizedArtifact = Required<Pick<Artifact, 'id'>> & {
  name: string;
  type?: string;
  content?: string;
  url?: string;
};

export type NormalizedDocumentAccess = Required<Pick<DocumentAccess, 'id' | 'title'>> &
  Pick<DocumentAccess, 'action' | 'status' | 'reason' | 'sourceUri' | 'snippet' | 'score'>;

export type RunResponse = Partial<AgentRun> & {
  run?: Partial<AgentRun> & { events?: Array<Partial<TimelineEvent> & Record<string, unknown>> };
  runId?: string;
  answer?: string | { text?: string; citations?: Citation[] };
  finalAnswer?: string | { text?: string; citations?: Citation[] };
  events?: Array<Partial<TimelineEvent> & Record<string, unknown>>;
  document_accesses?: DocumentAccess[];
  documentAccesses?: DocumentAccess[];
};

export type EventsResponse =
  | { events?: Array<Partial<TimelineEvent> & Record<string, unknown>> }
  | Array<Partial<TimelineEvent> & Record<string, unknown>>;

export function normalizeRun(
  response: RunResponse,
  options: {
    previous?: AgentRun | null;
    fallbackQuestion?: string;
    fallbackDocumentScope?: string;
  } = {}
): AgentRun {
  const source: RunResponse = response.run ?? response;
  const answerSource = source.finalAnswer ?? source.answer;
  const answerText = typeof answerSource === 'string' ? answerSource : answerSource?.text;
  const answerCitations = typeof answerSource === 'object' ? answerSource.citations : undefined;
  const id = source.id ?? response.runId ?? options.previous?.id ?? 'pending';
  const normalizedScope =
    (source.documentScope ??
      options.previous?.documentScope ??
      options.fallbackDocumentScope?.trim()) ||
    undefined;

  return {
    id,
    status: normalizeStatus(source.status ?? options.previous?.status ?? 'running'),
    question: source.question ?? options.previous?.question ?? options.fallbackQuestion?.trim() ?? '',
    documentScope: normalizedScope,
    answer: answerText ?? options.previous?.answer,
    createdAt: source.createdAt ?? options.previous?.createdAt,
    updatedAt: source.updatedAt ?? options.previous?.updatedAt,
    citations: normalizeCitations(source.citations ?? answerCitations ?? options.previous?.citations ?? []),
    artifacts: normalizeArtifacts(source.artifacts ?? options.previous?.artifacts ?? []),
    documentAccesses: normalizeDocumentAccesses(
      source.documentAccesses ?? response.document_accesses ?? options.previous?.documentAccesses ?? []
    )
  };
}

export function normalizeEvents(response: EventsResponse, previous: TimelineEvent[]): TimelineEvent[] {
  const rawEvents = Array.isArray(response) ? response : response.events ?? [];
  if (rawEvents.length === 0) return previous;

  return rawEvents.map((event, index) => ({
    id: String(event.id ?? `${event.type ?? 'event'}-${event.at ?? event.createdAt ?? index}`),
    at: String(event.at ?? event.createdAt ?? event.timestamp ?? new Date().toISOString()),
    label: String(event.label ?? event.type ?? event.name ?? 'Agent event'),
    status: normalizeStatus(event.status),
    detail:
      typeof event.detail === 'string'
        ? event.detail
        : typeof event.message === 'string'
          ? event.message
          : undefined
  }));
}

export function normalizeCitations(items: Citation[]): NormalizedCitation[] {
  return items.map((item, index) => ({
    id: String(item.id ?? item.documentId ?? index + 1),
    title: item.title ?? item.source ?? item.documentId ?? `Citation ${index + 1}`,
    source: item.source,
    excerpt: item.excerpt,
    url: item.url
  }));
}

export function normalizeArtifacts(items: Artifact[]): NormalizedArtifact[] {
  return items.map((item, index) => ({
    id: String(item.id ?? index + 1),
    name: item.name ?? item.title ?? `Artifact ${index + 1}`,
    type: item.type ?? item.kind,
    content: item.content,
    url: item.url
  }));
}

export function normalizeDocumentAccesses(items: DocumentAccess[]): NormalizedDocumentAccess[] {
  return items.map((item, index) => ({
    id: String(item.id ?? item.documentId ?? index + 1),
    title: item.title ?? item.documentId ?? `Document ${index + 1}`,
    action: item.action,
    status: item.status,
    reason: item.reason ?? item.snippet ?? item.sourceUri,
    sourceUri: item.sourceUri,
    snippet: item.snippet,
    score: item.score
  }));
}

export function normalizeStatus(status: unknown): RunStatus {
  if (
    status === 'queued' ||
    status === 'running' ||
    status === 'succeeded' ||
    status === 'failed' ||
    status === 'cancelled'
  ) {
    return status;
  }
  if (status === 'complete' || status === 'completed' || status === 'success') return 'succeeded';
  if (status === 'error') return 'failed';
  return 'running';
}

export function isTerminal(status: RunStatus) {
  return ['succeeded', 'failed', 'cancelled'].includes(status);
}

export function statusLabel(status: RunStatus) {
  const labels: Record<RunStatus, string> = {
    idle: 'Ready',
    queued: 'Queued',
    running: 'Running',
    succeeded: 'Succeeded',
    failed: 'Failed',
    cancelled: 'Cancelled'
  };
  return labels[status];
}

export function errorToMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
