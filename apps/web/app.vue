<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Link2,
  Loader2,
  Play,
  ScrollText,
  XCircle
} from 'lucide-vue-next';
import * as styles from './app.css';
import {
  errorToMessage,
  isTerminal,
  normalizeEvents,
  normalizeRun,
  statusLabel,
  type AgentRun,
  type EventsResponse,
  type RunResponse,
  type RunStatus,
  type TimelineEvent
} from './app.utils';

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const question = ref('');
const documentScope = ref('');
const run = ref<AgentRun | null>(null);
const events = ref<TimelineEvent[]>([]);
const isSubmitting = ref(false);
const errorMessage = ref('');
const resultRegion = ref<HTMLElement | null>(null);

let pollTimer: number | undefined;

const currentStatus = computed<RunStatus>(() => run.value?.status ?? 'idle');
const isBusy = computed(() => isSubmitting.value || ['queued', 'running'].includes(currentStatus.value));
const canSubmit = computed(() => question.value.trim().length > 0 && !isBusy.value);
const statusText = computed(() => statusLabel(currentStatus.value));
const statusTone = computed(() => {
  if (currentStatus.value === 'succeeded') return styles.statusSuccess;
  if (['failed', 'cancelled'].includes(currentStatus.value)) return styles.statusError;
  if (['queued', 'running'].includes(currentStatus.value)) return styles.statusActive;
  return styles.statusNeutral;
});

onBeforeUnmount(() => {
  stopPolling();
});

async function submitRun() {
  if (!canSubmit.value) return;

  stopPolling();
  errorMessage.value = '';
  isSubmitting.value = true;
  events.value = [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      label: 'Run submitted',
      status: 'queued',
      detail: 'Waiting for the agent workflow to start.'
    }
  ];

  const submittedQuestion = question.value.trim();
  const submittedScope = documentScope.value.trim();

  run.value = {
    id: 'pending',
    status: 'queued',
    question: submittedQuestion,
    documentScope: submittedScope || undefined,
    citations: [],
    artifacts: [],
    documentAccesses: []
  };

  try {
    const response = await $fetch<RunResponse>(`${apiBase}/api/runs`, {
      method: 'POST',
      body: {
        question: submittedQuestion,
        documentScope: submittedScope || undefined
      }
    });
    const normalized = normalizeRun(response, {
      previous: run.value,
      fallbackQuestion: question.value,
      fallbackDocumentScope: documentScope.value
    });
    run.value = normalized;
    events.value = normalizeEvents(
      { events: response.run?.events ?? response.events ?? [] },
      events.value
    );
    await nextTick();
    resultRegion.value?.focus();
    if (isTerminal(normalized.status)) {
      return;
    }
    pollRun(normalized.id);
  } catch (error) {
    errorMessage.value = errorToMessage(error, 'Run submission failed.');
    run.value = run.value ? { ...run.value, status: 'failed' } : null;
    events.value.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      label: 'Submission failed',
      status: 'failed',
      detail: errorMessage.value
    });
  } finally {
    isSubmitting.value = false;
  }
}

function resetConsole() {
  stopPolling();
  question.value = '';
  documentScope.value = '';
  run.value = null;
  events.value = [];
  errorMessage.value = '';
}

function pollRun(runId: string) {
  stopPolling();

  const tick = async () => {
    try {
      const [runResponse, eventResponse] = await Promise.all([
        $fetch<RunResponse>(`${apiBase}/api/runs/${runId}`),
        $fetch<EventsResponse>(`${apiBase}/api/runs/${runId}/events`)
      ]);
      run.value = normalizeRun(runResponse, {
        previous: run.value,
        fallbackQuestion: question.value,
        fallbackDocumentScope: documentScope.value
      });
      events.value = normalizeEvents(eventResponse, events.value);
      if (!isTerminal(run.value.status)) {
        pollTimer = window.setTimeout(tick, 1600);
      }
    } catch (error) {
      errorMessage.value = errorToMessage(error, 'Run polling failed.');
      if (run.value) {
        run.value = { ...run.value, status: 'failed' };
      }
      events.value.push({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        label: 'Polling failed',
        status: 'failed',
        detail: errorMessage.value
      });
    }
  };

  pollTimer = window.setTimeout(tick, 800);
}

function stopPolling() {
  if (pollTimer !== undefined) {
    window.clearTimeout(pollTimer);
    pollTimer = undefined;
  }
}

</script>

<template>
  <main :class="styles.shell">
    <section :class="styles.consolePanel" aria-labelledby="console-title">
      <header :class="styles.hero">
        <div :class="styles.brandRow">
          <span :class="styles.brandMark" aria-hidden="true">
            <Bot :size="22" />
          </span>
          <div>
            <p :class="styles.eyebrow">Agentic RAG</p>
            <h1 id="console-title" :class="styles.heading">QA Console</h1>
          </div>
        </div>
        <p :class="styles.subheading">
          Ask a question, constrain retrieval scope when needed, then inspect the agent run, answer evidence, and generated outputs.
        </p>
      </header>

      <form :class="styles.runForm" @submit.prevent="submitRun">
        <div :class="styles.fieldGroup">
          <label for="question" :class="styles.label">Question</label>
          <textarea
            id="question"
            v-model="question"
            :class="styles.questionInput"
            rows="7"
            required
            placeholder="Example: What changed in the latest architecture notes, and which documents support it?"
          />
        </div>

        <div :class="styles.fieldGroup">
          <label for="document-scope" :class="styles.label">Optional document scope</label>
          <input
            id="document-scope"
            v-model="documentScope"
            :class="styles.scopeInput"
            type="text"
            placeholder="Example: docs/spec, product=payments, owner:platform"
          />
          <p :class="styles.helpText">Leave blank to let the retriever choose from the full available corpus.</p>
        </div>

        <p v-if="errorMessage" :class="styles.error" role="alert">
          <AlertCircle :size="18" aria-hidden="true" />
          {{ errorMessage }}
        </p>

        <div :class="styles.actionRow">
          <button :class="styles.secondaryButton" type="button" :disabled="isBusy" @click="resetConsole">
            Reset
          </button>
          <button :class="styles.primaryButton" type="submit" :disabled="!canSubmit">
            <Loader2 v-if="isBusy" :class="styles.spinIcon" :size="18" aria-hidden="true" />
            <Play v-else :size="18" aria-hidden="true" />
            Run QA
          </button>
        </div>
      </form>
    </section>

    <section
      ref="resultRegion"
      :class="styles.resultsPanel"
      aria-labelledby="run-title"
      aria-live="polite"
      tabindex="-1"
    >
      <header :class="styles.resultsHeader">
        <div>
          <p :class="styles.eyebrow">Run state</p>
          <h2 id="run-title" :class="styles.sectionTitle">
            {{ run?.id && run.id !== 'pending' ? run.id : 'No run yet' }}
          </h2>
        </div>
        <span :class="[styles.statusPill, statusTone]">
          <Activity v-if="currentStatus === 'running'" :size="16" aria-hidden="true" />
          <Clock3 v-else-if="currentStatus === 'queued' || currentStatus === 'idle'" :size="16" aria-hidden="true" />
          <CheckCircle2 v-else-if="currentStatus === 'succeeded'" :size="16" aria-hidden="true" />
          <XCircle v-else :size="16" aria-hidden="true" />
          {{ statusText }}
        </span>
      </header>

      <div v-if="!run" :class="styles.emptyState">
        <FileSearch :size="34" aria-hidden="true" />
        <p>Submit a question to start an agent run. Results, citations, artifacts, and document access records will appear here.</p>
      </div>

      <div v-else :class="styles.resultGrid">
        <article :class="styles.answerPanel">
          <div :class="styles.cardHeader">
            <ScrollText :size="18" aria-hidden="true" />
            <h3 :class="styles.cardTitle">Final answer</h3>
          </div>
          <p v-if="run.answer" :class="styles.answerText">{{ run.answer }}</p>
          <p v-else :class="styles.mutedText">
            The agent has not produced a final answer yet.
          </p>
        </article>

        <article :class="styles.timelinePanel">
          <div :class="styles.cardHeader">
            <Activity :size="18" aria-hidden="true" />
            <h3 :class="styles.cardTitle">Timeline</h3>
          </div>
          <ol :class="styles.timelineList">
            <li v-for="event in events" :key="event.id" :class="styles.timelineItem">
              <span :class="styles.timelineDot" aria-hidden="true" />
              <div>
                <div :class="styles.timelineTopline">
                  <span>{{ event.label }}</span>
                  <time :class="styles.timelineTime" :datetime="event.at">
                    {{ new Date(event.at).toLocaleTimeString() }}
                  </time>
                </div>
                <p v-if="event.detail" :class="styles.timelineDetail">{{ event.detail }}</p>
              </div>
            </li>
          </ol>
        </article>

        <article :class="styles.evidencePanel">
          <div :class="styles.cardHeader">
            <Link2 :size="18" aria-hidden="true" />
            <h3 :class="styles.cardTitle">Citations</h3>
          </div>
          <ul v-if="run.citations.length > 0" :class="styles.itemList">
            <li v-for="citation in run.citations" :key="citation.id" :class="styles.listItem">
              <a v-if="citation.url" :href="citation.url" target="_blank" rel="noreferrer" :class="styles.itemTitle">
                {{ citation.title }}
              </a>
              <span v-else :class="styles.itemTitle">{{ citation.title }}</span>
              <span v-if="citation.source" :class="styles.itemMeta">{{ citation.source }}</span>
              <p v-if="citation.excerpt" :class="styles.itemBody">{{ citation.excerpt }}</p>
            </li>
          </ul>
          <p v-else :class="styles.mutedText">No citations reported yet.</p>
        </article>

        <article :class="styles.evidencePanel">
          <div :class="styles.cardHeader">
            <Database :size="18" aria-hidden="true" />
            <h3 :class="styles.cardTitle">Document accesses</h3>
          </div>
          <ul v-if="run.documentAccesses.length > 0" :class="styles.itemList">
            <li v-for="access in run.documentAccesses" :key="access.id" :class="styles.listItem">
              <span :class="styles.itemTitle">{{ access.title }}</span>
              <span :class="styles.itemMeta">
                {{ [access.action, access.status].filter(Boolean).join(' / ') || 'access recorded' }}
              </span>
              <p v-if="access.reason" :class="styles.itemBody">{{ access.reason }}</p>
            </li>
          </ul>
          <p v-else :class="styles.mutedText">No document access records reported yet.</p>
        </article>

        <article :class="styles.evidencePanel">
          <div :class="styles.cardHeader">
            <FileSearch :size="18" aria-hidden="true" />
            <h3 :class="styles.cardTitle">Artifacts</h3>
          </div>
          <ul v-if="run.artifacts.length > 0" :class="styles.itemList">
            <li v-for="artifact in run.artifacts" :key="artifact.id" :class="styles.listItem">
              <a v-if="artifact.url" :href="artifact.url" target="_blank" rel="noreferrer" :class="styles.itemTitle">
                {{ artifact.name }}
              </a>
              <span v-else :class="styles.itemTitle">{{ artifact.name }}</span>
              <span v-if="artifact.type" :class="styles.itemMeta">{{ artifact.type }}</span>
            </li>
          </ul>
          <p v-else :class="styles.mutedText">No artifacts reported yet.</p>
        </article>
      </div>
    </section>
  </main>
</template>
