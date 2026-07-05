import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message as BedrockMessage
} from '@aws-sdk/client-bedrock-runtime';
import { config } from './config.js';
import type { ChatMessage } from './db.js';

type ProviderMessage = Pick<ChatMessage, 'role' | 'content'>;

export async function generateReply(messages: ProviderMessage[]) {
  if (config.LLM_PROVIDER === 'bedrock') {
    return generateWithBedrock(messages);
  }
  return generateWithOllama(messages);
}

async function generateWithOllama(messages: ProviderMessage[]) {
  const response = await fetch(`${config.OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'あなたは簡潔で実用的な日本語のAIアシスタントです。'
        },
        ...messages
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content?.trim() || '応答を生成できませんでした。';
}

async function generateWithBedrock(messages: ProviderMessage[]) {
  const client = new BedrockRuntimeClient({ region: config.AWS_REGION });
  const bedrockMessages: BedrockMessage[] = messages.map((message) => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: [{ text: message.content }]
  }));

  const result = await client.send(
    new ConverseCommand({
      modelId: config.BEDROCK_MODEL_ID,
      system: [{ text: 'あなたは簡潔で実用的な日本語のAIアシスタントです。' }],
      messages: bedrockMessages,
      inferenceConfig: {
        maxTokens: 1024,
        temperature: 0.4
      }
    })
  );

  const text = result.output?.message?.content
    ?.map((part) => ('text' in part ? part.text : ''))
    .join('')
    .trim();

  return text || '応答を生成できませんでした。';
}
