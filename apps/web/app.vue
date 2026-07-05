<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { Bot, MessageSquarePlus, Send, UserRound } from 'lucide-vue-next';
import * as styles from './app.css';

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

const config = useRuntimeConfig();
const apiBase = config.public.apiBase;

const conversations = ref<Conversation[]>([]);
const activeConversationId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
const draft = ref('');
const isSending = ref(false);
const errorMessage = ref('');
const messagePane = ref<HTMLElement | null>(null);

const activeConversation = computed(() =>
  conversations.value.find((conversation) => conversation.id === activeConversationId.value)
);

const canSend = computed(() => draft.value.trim().length > 0 && !isSending.value);

onMounted(async () => {
  await loadConversations();
  if (conversations.value.length > 0) {
    await selectConversation(conversations.value[0].id);
  }
});

async function loadConversations() {
  const data = await $fetch<{ conversations: Conversation[] }>(`${apiBase}/api/conversations`);
  conversations.value = data.conversations;
}

async function selectConversation(id: string) {
  activeConversationId.value = id;
  const data = await $fetch<{ messages: ChatMessage[] }>(
    `${apiBase}/api/conversations/${id}/messages`
  );
  messages.value = data.messages;
  await scrollToBottom();
}

async function newChat() {
  activeConversationId.value = null;
  messages.value = [];
  draft.value = '';
  errorMessage.value = '';
}

async function sendMessage() {
  if (!canSend.value) return;

  const content = draft.value.trim();
  draft.value = '';
  errorMessage.value = '';
  isSending.value = true;

  const tempUser: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId: activeConversationId.value || 'pending',
    role: 'user',
    content,
    createdAt: new Date().toISOString()
  };
  messages.value.push(tempUser);
  await scrollToBottom();

  try {
    const result = await $fetch<{ conversationId: string; message: ChatMessage }>(
      `${apiBase}/api/chat`,
      {
        method: 'POST',
        body: {
          conversationId: activeConversationId.value || undefined,
          message: content
        }
      }
    );

    activeConversationId.value = result.conversationId;
    messages.value = messages.value
      .filter((message) => message.id !== tempUser.id)
      .concat([
        {
          ...tempUser,
          conversationId: result.conversationId
        },
        result.message
      ]);
    await loadConversations();
    await scrollToBottom();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'メッセージ送信に失敗しました。';
    messages.value = messages.value.filter((message) => message.id !== tempUser.id);
  } finally {
    isSending.value = false;
  }
}

function submitOnEnter(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void sendMessage();
  }
}

async function scrollToBottom() {
  await nextTick();
  messagePane.value?.scrollTo({
    top: messagePane.value.scrollHeight,
    behavior: 'smooth'
  });
}
</script>

<template>
  <main :class="styles.shell">
    <aside :class="styles.sidebar">
      <div :class="styles.brand">
        <div :class="styles.brandMark">
          <Bot :size="20" />
        </div>
        <div>
          <div :class="styles.brandTitle">Local AI Chat</div>
          <div :class="styles.brandMeta">Ollama / Bedrock ready</div>
        </div>
      </div>

      <button :class="styles.newButton" type="button" @click="newChat">
        <MessageSquarePlus :size="18" />
        新しいチャット
      </button>

      <nav :class="styles.conversationList">
        <button
          v-for="conversation in conversations"
          :key="conversation.id"
          type="button"
          :class="[
            styles.conversationItem,
            conversation.id === activeConversationId ? styles.conversationItemActive : ''
          ]"
          @click="selectConversation(conversation.id)"
        >
          <span :class="styles.conversationTitle">{{ conversation.title }}</span>
          <span :class="styles.conversationDate">
            {{ new Date(conversation.updatedAt).toLocaleString('ja-JP') }}
          </span>
        </button>
      </nav>
    </aside>

    <section :class="styles.chatPanel">
      <header :class="styles.chatHeader">
        <div>
          <h1 :class="styles.heading">{{ activeConversation?.title || '新しいチャット' }}</h1>
          <p :class="styles.subheading">ローカルでは qwen2.5:0.5b、クラウドでは Bedrock に切り替え可能</p>
        </div>
      </header>

      <div ref="messagePane" :class="styles.messages">
        <div v-if="messages.length === 0" :class="styles.emptyState">
          <Bot :size="28" />
          <p>質問を入力して会話を開始してください。</p>
        </div>

        <article
          v-for="message in messages"
          :key="message.id"
          :class="[styles.messageRow, message.role === 'user' ? styles.messageRowUser : '']"
        >
          <div :class="styles.avatar">
            <UserRound v-if="message.role === 'user'" :size="18" />
            <Bot v-else :size="18" />
          </div>
          <div :class="[styles.bubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]">
            {{ message.content }}
          </div>
        </article>
      </div>

      <form :class="styles.composer" @submit.prevent="sendMessage">
        <p v-if="errorMessage" :class="styles.error">{{ errorMessage }}</p>
        <div :class="styles.composerBox">
          <textarea
            v-model="draft"
            :class="styles.textarea"
            rows="3"
            placeholder="日本語でメッセージを入力"
            @keydown="submitOnEnter"
          />
          <button :class="styles.sendButton" type="submit" :disabled="!canSend" aria-label="送信">
            <Send :size="18" />
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
