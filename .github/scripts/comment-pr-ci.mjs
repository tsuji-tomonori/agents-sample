import { readFileSync } from 'node:fs';

const marker = '<!-- agents-sample-ci-cd-summary -->';
const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pullRequest = event.pull_request;

if (!pullRequest) {
  console.log('No pull request context; skipping comment.');
  process.exit(0);
}

const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
const token = process.env.GITHUB_TOKEN;

if (!token) {
  throw new Error('GITHUB_TOKEN is required to post a pull request comment.');
}

const outcomes = [
  ['Generated docs', process.env.DOCS_CHECK_OUTCOME],
  ['Unit / snapshot / assertion tests', process.env.TEST_OUTCOME],
  ['Typecheck', process.env.TYPECHECK_OUTCOME],
  ['Application build', process.env.BUILD_OUTCOME],
  ['CDK synth + cdk-nag', process.env.CDK_SYNTH_OUTCOME],
  ['Cost estimate', process.env.COST_ESTIMATE_OUTCOME || inferCostEstimateOutcome()],
  ['Docker Compose config', process.env.DOCKER_COMPOSE_OUTCOME],
  ['CDK diff', process.env.CDK_DIFF_OUTCOME || inferCdkDiffOutcome()]
];

const body = `${marker}
## CI/CD Result

${renderSummary(outcomes)}

${renderDetails('Unit / Snapshot / Assertion Tests', 'ci-logs/test.log')}

${renderDetails('CDK Synth + cdk-nag', 'ci-logs/cdk-synth.log')}

${renderDetails('Cost Estimate', 'ci-logs/cost-estimate.log')}

${renderDetails('CDK Diff', 'ci-logs/cdk-diff.log')}

${renderDetails('Typecheck', 'ci-logs/typecheck.log')}

${renderDetails('Build', 'ci-logs/build.log')}

${renderDetails('Generated Docs Check', 'ci-logs/docs-check.log')}

${renderDetails('Docker Compose Config', 'ci-logs/docker-compose.log')}
`;

const commentsUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${pullRequest.number}/comments`;
const comments = await request(commentsUrl);
const previous = comments.find(
  (comment) => comment.user?.type === 'Bot' && typeof comment.body === 'string' && comment.body.includes(marker)
);

if (previous) {
  await request(previous.url, {
    method: 'PATCH',
    body: JSON.stringify({ body })
  });
  console.log(`Updated PR comment ${previous.id}.`);
} else {
  await request(commentsUrl, {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  console.log('Created PR comment.');
}

function renderSummary(items) {
  const rows = items
    .map(([name, outcome]) => `| ${name} | ${statusIcon(outcome)} ${outcome ?? 'unknown'} |`)
    .join('\n');
  return `| Check | Result |
| --- | --- |
${rows}`;
}

function renderDetails(title, file) {
  const content = readLog(file);
  return `<details>
<summary>${title}</summary>

\`\`\`text
${content}
\`\`\`

</details>`;
}

function readLog(file) {
  try {
    return truncateForComment(readFileSync(file, 'utf8').trim() || '(no output)');
  } catch {
    return '(log not found)';
  }
}

function truncateForComment(value) {
  const safe = value.replaceAll('</details>', '<\\/details>');
  const max = 12000;
  if (safe.length <= max) return safe;
  return `${safe.slice(0, 4000)}

... truncated ${safe.length - max} characters ...

${safe.slice(-8000)}`;
}

function statusIcon(outcome) {
  if (outcome === 'success') return '[pass]';
  if (outcome === 'failure') return '[fail]';
  if (outcome === 'skipped') return '[skip]';
  return '[unknown]';
}

function inferCdkDiffOutcome() {
  const log = readLog('ci-logs/cdk-diff.log');
  return log.startsWith('CDK diff skipped.') ? 'skipped' : 'unknown';
}

function inferCostEstimateOutcome() {
  const log = readLog('ci-logs/cost-estimate.log');
  return log.startsWith('Cost estimate skipped.') ? 'skipped' : 'unknown';
}

async function request(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url} failed: ${response.status} ${await response.text()}`);
  }

  if (response.status === 204) return null;
  return response.json();
}
