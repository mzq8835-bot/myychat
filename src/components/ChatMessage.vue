<template>
  <div class="message" :class="messageClass">
    <div class="message-wrapper" :class="{'user-wrapper': message.isUser}">
      <div class="avatar" :class="{'user-avatar': message.isUser}">
        <img v-if="message.avatarUrl" :src="message.avatarUrl" alt="avatar" class="avatar-img" />
        <svg v-else-if="message.isUser" width="24" height="24" viewBox="0 0 24 24" fill="none">
           <circle cx="12" cy="12" r="12" fill="#e0e7ff"/>
           <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#4f46e5"/>
        </svg>
        <div v-else class="ai-avatar">
          <!-- Blue square with rounded corners and white icon -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#2563eb"/>
            <path d="M12 4L4 8l8 4 8-4-8-4zM4 16l8 4 8-4M4 12l8 4 8-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div class="message-main">
        <div class="message-header" :class="{'user-header': message.isUser}">
          <!-- AI Header: Timestamp + Model Badge -->
          <template v-if="!message.isUser">
            <span class="message-time">{{ formattedDateTime }}</span>
            <span class="model-badge">{{ message.modelName || 'DeepSeek-R1' }}</span>
          </template>
          
          <!-- User Header: Just Time (or keep simple) -->
          <template v-else>
            <span class="message-time">{{ formattedDateTime }}</span>
          </template>
        </div>

        <!-- 思考过程 -->
        <div v-if="!message.isUser && message.thinking" class="thinking-section">
          <div class="thinking-header" @click="toggleThinking">
            <div class="thinking-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            <span class="thinking-title">深度思考</span>
            <span v-if="message.thinkingTime" class="thinking-time">{{ message.thinkingTime }}</span>
            <svg class="chevron" :class="{expanded: showThinking}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div v-show="showThinking" class="thinking-content">
            <div v-html="renderedThinking"></div>
          </div>
        </div>

        <div v-if="message.images && message.images.length > 0" class="message-images">
          <div v-for="(img, idx) in message.images" :key="idx" class="message-image">
            <img :src="img.dataUrl" :alt="img.name" @click="openImagePreview(img)" />
          </div>
        </div>
        
        <div class="message-bubble" :class="{'user-bubble': message.isUser}">
          <div class="message-content" v-html="renderedContent"></div>
          <span v-if="message.isStreaming" class="streaming-cursor"></span>
        </div>

        <div class="message-footer" v-if="!message.isUser">
          <div class="message-actions">
            <button
                class="action-btn"
                @click="$emit('copy-message', message.content)"
                title="复制"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
            <button class="action-btn" title="重新生成">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6"></path>
                <path d="M1 20v-6h6"></path>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
})

export default {
  name: 'ChatMessage',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  emits: ['stop-streaming', 'copy-message'],
  setup(props) {
    const showThinking = ref(false)

    const messageClass = computed(() => ({
      'user-message': props.message.isUser,
      'ai-message': !props.message.isUser
    }))

    const formattedTime = computed(() => {
      const d = props.message.timestamp instanceof Date ? props.message.timestamp : new Date(props.message.timestamp)
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      return `${hour}:${minute}`
    })

    const formattedDateTime = computed(() => {
      const d = props.message.timestamp instanceof Date ? props.message.timestamp : new Date(props.message.timestamp)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hour = String(d.getHours()).padStart(2, '0')
      const minute = String(d.getMinutes()).padStart(2, '0')
      const second = String(d.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    })

    const renderedContent = computed(() => {
      if (!props.message.content) return ''
      return md.render(props.message.content)
    })

    const renderedThinking = computed(() => {
      if (!props.message.thinking) return ''
      return md.render(props.message.thinking)
    })

    function toggleThinking() {
      showThinking.value = !showThinking.value
    }

    function openImagePreview(img) {
      window.open(img.dataUrl, '_blank')
    }

    return {
      messageClass,
      formattedTime,
      formattedDateTime,
      renderedContent,
      renderedThinking,
      showThinking,
      toggleThinking,
      openImagePreview
    }
  }
}
</script>

<style scoped>
.message {
  width: 100%;
  padding: 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-wrapper {
  max-width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-wrapper.user-wrapper {
  flex-direction: row-reverse;
}

.avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px; /* Changed to match square look if needed, or keep circle for user */
  overflow: hidden;
}

.user-avatar {
  border-radius: 50%;
}

.ai-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar svg {
  width: 100%;
  height: 100%;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-main {
  flex: 1;
  min-width: 0;
  max-width: 90%;
  display: flex;
  flex-direction: column;
}

.message-wrapper.user-wrapper .message-main {
  align-items: flex-end;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  height: 24px;
}

.message-header.user-header {
  justify-content: flex-end;
}

.message-time {
  font-size: 13px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.model-badge {
  font-size: 12px;
  color: #374151;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

/* Thinking Section */
.thinking-section {
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f9fafb;
  overflow: hidden;
  width: 100%; /* Ensure thinking section takes full width of container (which is flex-end for user) */
}

/* ... (keep thinking styles) ... */
.thinking-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.thinking-header:hover {
  background: #f3f4f6;
}

.thinking-indicator {
  display: flex;
  gap: 3px;
}

.thinking-indicator .dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #9ca3af;
}

.thinking-title {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.thinking-time {
  font-size: 12px;
  color: #9ca3af;
  margin-left: auto;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.expanded {
  transform: rotate(180deg);
}

.thinking-content {
  padding: 12px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  line-height: 1.6;
  color: #6b7280;
  text-align: left; /* Always left align thinking */
}

.message-bubble {
  position: relative;
  padding: 0;
  border-radius: 12px;
  color: #1f2937;
  width: fit-content; /* Allow bubble to fit content */
  max-width: 100%;
}

.user-bubble {
  background: #3b82f6;
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px 0 12px 12px;
  text-align: left;
}

.message-content {
  font-size: 15px;
  line-height: 1.7;
  word-break: break-word;
}

/* Markdown Styles */
.message-content :deep(p) { margin: 8px 0; }
.message-content :deep(p:first-child) { margin-top: 0; }
.message-content :deep(p:last-child) { margin-bottom: 0; }

.message-content :deep(a) { color: #3b82f6; text-decoration: none; }
.message-content :deep(a:hover) { text-decoration: underline; }

/* User bubble specific link styles */
.user-bubble .message-content :deep(a) { color: #fff; text-decoration: underline; }

.message-content :deep(code) {
  background: #f3f4f6;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
  color: #ef4444;
}

/* User bubble specific code styles */
.user-bubble .message-content :deep(code) {
  background: rgba(255,255,255,0.2);
  color: #fff;
}

.message-content :deep(pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #f9fafb;
  font-size: 0.9em;
}

.message-content :deep(ul), .message-content :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.message-images {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.message-image {
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  cursor: pointer;
}

.message-image img {
  width: 100%;
  height: auto;
  display: block;
}

.streaming-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #3b82f6;
  margin-left: 4px;
  vertical-align: middle;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1 }
  51%, 100% { opacity: 0 }
}

.message-footer {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-wrapper:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #4b5563;
}

@media (max-width: 768px) {
  .message-wrapper { gap: 10px; }
  .avatar { width: 28px; height: 28px; }
  .message-main { max-width: 100%; }
}
</style>