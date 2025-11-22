<template>
  <div class="app">
    <div class="chat-wrapper">
      <sidebar-conversations
        :conversations="conversations"
        :current-id="currentConversationId"
        :loading="isLoadingSessions"
        :has-more="hasMoreSessions"
        @select="selectConversation"
        @new="handleNewConversation"
        @load-more="handleLoadMoreSessions"
        @edit="handleEditConversation"
        @delete="handleDeleteConversation"
        @view-all="handleViewAll"
        @ai-search="handleAISearchView"
      />

      <div class="chat-panel" v-if="currentView === 'chat'">
        <div class="chat-header">
          <div class="title">{{ currentConversation.title || '未命名会话' }}</div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-if="isLoadingMessages" class="loading-indicator">
            <span>加载消息中...</span>
          </div>

          <ChatMessage
            v-for="msg in currentConversation.messages"
            :key="msg.id"
            :message="msg"
            @stop-streaming="stopStreaming"
            @copy-message="copyMessage"
          />

          <div v-if="isTyping" class="typing-indicator">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span style="margin-left: 8px;">AI正在思考</span>
          </div>
        </div>

        <composer
          :model-options="modelOptions"
          :selected-model="currentConversation.model"
          :is-loading="isLoading"
          @send="handleSend"
          @upload-files="handleUploadFiles"
          @update:selectedModel="handleModelUpdate"
        />
      </div>

      <HistoryView 
        v-else-if="currentView === 'history'"
        :conversations="conversations" 
        @select="handleSelectFromHistory"
      />

      <WelcomeView
        v-else-if="currentView === 'welcome'"
        :model-options="modelOptions"
        :selected-model="currentConversation.model || 'gpt-4o'"
        @send="handleSend"
        @update:selectedModel="handleModelUpdate"
      />

      <AISearchView
        v-else-if="currentView === 'ai-search'"
        :model-options="modelOptions"
        :selected-model="currentConversation.model || 'gpt-4o'"
        @search="handleSend"
        @update:selectedModel="handleModelUpdate"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, nextTick, onMounted } from 'vue'
import ChatMessage from './components/ChatMessage.vue'
import SidebarConversations from './components/SidebarConversations.vue'
import Composer from './components/Composer.vue'
import HistoryView from './components/HistoryView.vue'
import WelcomeView from './components/WelcomeView.vue'
import AISearchView from './components/AISearchView.vue'

const API_BASE_URL = 'http://127.0.0.1:15001/api'

export default {
  name: 'App',
  components: {
    ChatMessage,
    SidebarConversations,
    Composer,
    HistoryView,
    WelcomeView,
    AISearchView
  },
  setup() {
    // 统一的 API 响应处理函数
    const handleApiResponse = async (response) => {
      const data = await response.json()

      // code为"00000"时为成功，否则全是失败
      if (data.code && data.code !== '00000') {
        const errorMsg = data.message || '请求失败'
        console.error('API 错误:', data.code, errorMsg)
        throw new Error(errorMsg)
      }

      return data
    }

    const modelOptions = ref([])
    const defaultModel = ref('gpt-4o') // 默认模型

    const conversations = ref([])
    const currentConversationId = ref(null)
    const isLoadingSessions = ref(false)
    const isLoadingMessages = ref(false)
    const hasMoreSessions = ref(true)
    const currentSessionPage = ref(1)
    const sessionPageSize = ref(20)
    const currentView = ref('welcome') // 'chat', 'history', 'welcome', 'ai-search'

    function handleViewAll() {
      currentView.value = 'history'
    }

    function handleSelectFromHistory(id) {
      currentView.value = 'chat'
      selectConversation(id)
    }

    function handleNewConversation() {
      currentView.value = 'welcome'
      currentConversationId.value = null
    }

    function handleAISearchView() {
      currentView.value = 'ai-search'
    }

    // 加载模型选项
    async function loadModelOptions() {
      try {
        const response = await fetch(`${API_BASE_URL}/userConfig/aiModelOptions`)
        const data = await handleApiResponse(response)

        console.log('模型选项接口返回数据:', data)

        // 检查不同的响应结构
        let options = []
        if (Array.isArray(data)) {
          options = data
        } else if (data && data.data && Array.isArray(data.data)) {
          options = data.data
        }

        // 转换为所需格式
        if (options.length > 0) {
          modelOptions.value = options.map(option => ({
            label: option.modelName,
            value: option.modelId,
            id: option.id  // 保存模型的数字id，用于提交接口
          }))

          // 查找默认模型
          const defaultOption = options.find(option => option.defaultFlag === true)
          if (defaultOption) {
            defaultModel.value = defaultOption.modelId
            console.log('设置默认模型:', defaultModel.value)
          } else if (modelOptions.value.length > 0) {
            // 如果没有找到默认标记，使用第一个模型
            defaultModel.value = modelOptions.value[0].value
          }
        }

        console.log('转换后的模型选项:', modelOptions.value)
      } catch (e) {
        console.error('加载模型选项失败:', e.message)
        // 如果接口失败，使用默认值
        modelOptions.value = [
          { label: 'gpt-4o', value: 'gpt-4o', id: '' }
        ]
      }
    }

    // 加载会话列表
    async function loadConversations(pageNum = 1, pageSize = 20, append = false) {
      try {
        isLoadingSessions.value = true
        const response = await fetch(`${API_BASE_URL}/chatSession/history?pageNum=${pageNum}&pageSize=${pageSize}`)
        const data = await handleApiResponse(response)

        console.log('会话列表接口返回数据:', data)

        // 检查不同的响应结构
        let sessionList = []
        let total = 0
        if (Array.isArray(data)) {
          // 如果直接返回数组
          sessionList = data
        } else if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
          // 如果返回 {data: {records: [...], total: ...}}
          sessionList = data.data.records
          total = data.data.total || 0
        } else if (data && data.data && Array.isArray(data.data)) {
          // 如果返回 {data: [...]}
          sessionList = data.data
        } else if (data && data.records && Array.isArray(data.records)) {
          // 如果返回 {records: [...], total: ...}
          sessionList = data.records
          total = data.total || 0
        }

        console.log('解析的会话列表:', sessionList)

        if (sessionList.length > 0) {
          // 转换接口数据格式
          const newConversations = sessionList.map(session => ({
            id: session.sessionId,
            title: session.sessionName || '未命名会话',
            model: session.model || defaultModel.value,
            messages: [],
            attachments: [],
            createdAt: session.createTime ? new Date(session.createTime) : new Date(),
            updatedAt: session.createTime ? new Date(session.createTime) : new Date()
          }))

          if (append) {
            // 追加模式：将新数据添加到现有列表
            conversations.value = [...conversations.value, ...newConversations]
          } else {
            // 重置模式：替换整个列表
            conversations.value = newConversations
          }

          // 判断是否还有更多数据
          hasMoreSessions.value = conversations.value.length < total || sessionList.length >= pageSize

          console.log('转换后的会话列表:', conversations.value)

          // 默认选中第一个会话（仅在首次加载时）
          if (!append && conversations.value.length > 0 && !currentConversationId.value) {
            currentConversationId.value = conversations.value[0].id
            console.log('选中会话ID:', currentConversationId.value)
            await loadMessages(conversations.value[0].id)
          }
        } else {
          if (!append) {
            console.warn('会话列表为空')
          }
          hasMoreSessions.value = false
        }
      } catch (e) {
        console.error('加载会话列表失败:', e.message)
        hasMoreSessions.value = false
      } finally {
        isLoadingSessions.value = false
      }
    }

    // 加载某个会话的消息列表
    async function loadMessages(sessionId) {
      try {
        isLoadingMessages.value = true
        const response = await fetch(`${API_BASE_URL}/chatMessage/page?sessionId=${sessionId}&pageNum=1&pageSize=1000`)
        const data = await handleApiResponse(response)

        console.log('消息列表接口返回数据:', data)

        const conv = conversations.value.find(c => c.id === sessionId)
        if (!conv) {
          console.warn('未找到会话:', sessionId)
          return
        }

        // 检查不同的响应结构
        let messageList = []
        if (Array.isArray(data)) {
          messageList = data
        } else if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
          // 如果返回 {data: {records: [...]}}
          messageList = data.data.records
        } else if (data && data.data && Array.isArray(data.data)) {
          messageList = data.data
        } else if (data && data.records && Array.isArray(data.records)) {
          messageList = data.records
        }

        console.log('解析的消息列表:', messageList)

        // 转换消息数据格式
        // roleType为1代表用户，roleType为2代表AI回复
        conv.messages = messageList.map((msg, index) => ({
          id: msg.id || index,
          content: msg.content || '',
          isUser: msg.roleType === 1,
          timestamp: msg.createTime ? new Date(msg.createTime) : new Date(),
          isStreaming: false,
          images: msg.images || [],
          avatarUrl: msg.avatarUrl || '',
          modelName: msg.modelName || '',
          thinking: msg.thinking || '',
          thinkingTime: msg.thinkingTime || ''
        }))

        console.log('转换后的消息列表:', conv.messages)

        scrollToBottom()
      } catch (e) {
        console.error('加载消息列表失败:', e.message)
      } finally {
        isLoadingMessages.value = false
      }
    }

    const currentConversation = computed(() => {
      const conv = conversations.value.find(c => c.id === currentConversationId.value) || conversations.value[0]
      // 返回默认值以避免 undefined 错误
      return conv || {
        id: null,
        title: '加载中...',
        model: defaultModel.value,
        messages: [],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    const messagesContainer = ref(null)
    const isLoading = ref(false)
    const isTyping = ref(false)
    const currentAbortController = ref(null)
    const currentStreamingMessageId = ref(null)


    function scrollToBottom() {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
      })
    }


    async function handleLoadMoreSessions({ pageNum, pageSize }) {
      console.log('加载更多会话:', pageNum, pageSize)
      currentSessionPage.value = pageNum
      await loadConversations(pageNum, pageSize, true)
    }

    async function handleEditConversation({ sessionId, sessionName }) {
      try {
        const response = await fetch(`${API_BASE_URL}/chatSession/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, sessionName })
        })
        const data = await handleApiResponse(response)

        console.log('编辑会话返回数据:', data)

        // 更新本地会话名称
        const conv = conversations.value.find(c => c.id === sessionId)
        if (conv) {
          conv.title = sessionName
        }
      } catch (e) {
        console.error('编辑会话失败:', e.message)
      }
    }

    async function handleDeleteConversation(sessionId) {
      try {
        const response = await fetch(`${API_BASE_URL}/chatSession/delete?sessionId=${sessionId}`, {
          method: 'POST'
        })
        const data = await handleApiResponse(response)

        console.log('删除会话返回数据:', data)

        // 从本地列表中移除
        const index = conversations.value.findIndex(c => c.id === sessionId)
        if (index !== -1) {
          conversations.value.splice(index, 1)
        }

        // 如果删除的是当前会话，切换到第一个会话
        if (currentConversationId.value === sessionId) {
          if (conversations.value.length > 0) {
            currentConversationId.value = conversations.value[0].id
            await loadMessages(conversations.value[0].id)
          } else {
            currentConversationId.value = null
          }
        }
      } catch (e) {
        console.error('删除会话失败:', e.message)
      }
    }

    async function selectConversation(id) {
      // Prevent event object from being used as ID
      if (id && typeof id === 'object' && id.constructor && id.constructor.name.includes('Event')) {
        console.warn('selectConversation received an event object instead of ID:', id)
        return
      }
      
      currentView.value = 'chat'
      currentConversationId.value = id
      await loadMessages(id)
      scrollToBottom()
    }

    function addMessageToConversation(conv, content, isUser = false, isStreaming = false, images = [], avatarUrl = '', modelName = '', thinking = '', thinkingTime = '') {
      const msg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        content,
        isUser,
        timestamp: new Date(),
        isStreaming,
        images: images || [],
        avatarUrl: avatarUrl || '',
        modelName: modelName || conv.model || '',
        thinking: thinking || '',
        thinkingTime: thinkingTime || ''
      }
      conv.messages.push(msg)
      conv.updatedAt = new Date()
      if (isStreaming) currentStreamingMessageId.value = msg.id
      scrollToBottom()
      return msg
    }

    function updateMessageContent(conv, messageId, content) {
      const m = conv.messages.find(x => x.id === messageId)
      if (m) {
        m.content = content
        scrollToBottom()
      }
    }

    function completeStreamingMessage(conv, messageId) {
      const m = conv.messages.find(x => x.id === messageId)
      if (m) {
        m.isStreaming = false
        m.timestamp = new Date()
      }
      currentStreamingMessageId.value = null
    }

    function stopStreaming() {
      if (currentAbortController.value) {
        currentAbortController.value.abort()
        currentAbortController.value = null
        isTyping.value = false
        if (currentStreamingMessageId.value) {
          completeStreamingMessage(currentConversation.value, currentStreamingMessageId.value)
        }
      }
    }

    async function fetchRealAPIResponse(conv, userMessage, opts = {}) {
      currentAbortController.value = new AbortController()
      const streamingMessage = addMessageToConversation(conv, '', false, true)
      let accumulatedContent = ''

      try {
        isTyping.value = true
        isLoading.value = true

        // 获取当前选中模型的modelId
        const currentModel = modelOptions.value.find(m => m.value === opts.model)
        if (!currentModel) {
          console.warn('未找到选中的模型，使用默认模型:', opts.model)
        }
        //const modelId = currentModel ? currentModel.id : (modelOptions.value[0]?.id || '')

        //console.log('发送消息 - 模型:', opts.model, 'modelId:', modelId)

        const body = {
          agentId: opts.agentId || '',
          messageContent: userMessage,
          modelId: opts.model,
          sessionId: String(conv.id),
          useInternetSearch: !!opts.use_internet_search
        }

        const response = await fetch(`${API_BASE_URL}/chatMessage/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: currentAbortController.value.signal
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const json = line.startsWith('data: ') ? JSON.parse(line.slice(6)) : JSON.parse(line)

              // 检查错误码 - code为"00000"时为成功，否则全是失败
              if (json.code && json.code !== '00000') {
                console.error('接口返回错误:', json.code, json.message)
                updateMessageContent(conv, streamingMessage.id, `错误：${json.message || '请求失败'}`)
                completeStreamingMessage(conv, streamingMessage.id)
                isTyping.value = false
                isLoading.value = false
                return
              }

              if (json.event === 'chat_message' && json.answer) {
                accumulatedContent += json.answer
                updateMessageContent(conv, streamingMessage.id, accumulatedContent)
              } else if (json.event === 'stream_end') {
                break
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }

        completeStreamingMessage(conv, streamingMessage.id)

      } catch (error) {
        if (error.name === 'AbortError') {
          completeStreamingMessage(conv, streamingMessage.id)
        } else {
          console.error('发送消息失败:', error)
          updateMessageContent(conv, streamingMessage.id, '抱歉，发生了错误，请稍后重试。')
          completeStreamingMessage(conv, streamingMessage.id)
        }
      } finally {
        currentAbortController.value = null
        isTyping.value = false
        isLoading.value = false
      }
    }

    async function handleSend({ text, model, use_internet_search, deep_thinking, images }) {
      if ((!text && (!images || images.length === 0)) || isLoading.value) return
      const conv = currentConversation.value
      // add user message with images
      addMessageToConversation(conv, text || '', true, false, images)
      await fetchRealAPIResponse(conv, text || '', { model, use_internet_search, deep_thinking })
    }

    function handleUploadFiles(files) {
      const conv = currentConversation.value
      for (const f of files) {
        conv.attachments.push({ name: f.name, size: f.size, type: f.type })
      }
      conv.updatedAt = new Date()
    }

    function copyMessage(content) {
      try { navigator.clipboard.writeText(content) } catch (e) { }
    }

    onMounted(async () => {
      await loadModelOptions()
      await loadConversations(currentSessionPage.value, sessionPageSize.value, false)
      scrollToBottom()
    })

    function handleModelUpdate(newModel) {
      console.log('App received model update:', newModel)
      const conv = currentConversation.value
      if (conv) {
        conv.model = newModel
      }
    }

    return {
      conversations,
      currentConversationId,
      currentConversation,
      modelOptions,
      messagesContainer,
      isLoading,
      isTyping,
      isLoadingSessions,
      isLoadingMessages,
      hasMoreSessions,
      selectConversation,
      handleSend,
      handleUploadFiles,
      stopStreaming,
      copyMessage,
      loadConversations,
      loadMessages,
      handleLoadMoreSessions,
      handleEditConversation,
      handleDeleteConversation,
      handleModelUpdate,
      handleViewAll,
      handleSelectFromHistory,
      handleNewConversation,
      handleAISearchView,
      currentView
    }
  }
}
</script>

<style>
/* Fill the full viewport and create a clean background */
* { box-sizing: border-box; }
html, body, #app { height: 100%; margin: 0; }
body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; 
  background: #f5f7fa; /* Light blue-ish gray background */
  color: #333;
}

.app { height: 100%; display:flex; }

.chat-wrapper {
  width: 100%;
  height: 100vh;
  background: #f5f7fa;
  display:flex;
  overflow:hidden;
}

/* Sidebar is now transparent/blended or white with specific styling */
.chat-wrapper .sidebar { 
  /* border-right:1px solid #e5e7eb; */
  /* background: #fff; */
}

.chat-panel { 
  flex:1; 
  display:flex; 
  flex-direction:column; 
  background: #fff; 
  margin: 10px 10px 10px 0; /* Add margin to separate from sidebar */
  border-radius: 20px; /* Rounded corners for the main chat area */
  box-shadow: 0 4px 20px rgba(0,0,0,0.05); /* Subtle shadow */
  overflow: hidden;
  position: relative;
}

.chat-header { 
  display:none; /* Hide default header as per design, or make it very subtle */
}

.chat-messages { 
  flex:1; 
  padding: 20px 10%; /* Add horizontal padding */
  overflow:auto; 
  background: #fff; 
  display:flex; 
  flex-direction:column; 
  gap: 20px;
}
.chat-messages::-webkit-scrollbar { width:6px }
.chat-messages::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius:3px }
.chat-messages::-webkit-scrollbar-track { background: transparent }

.loading-indicator {
  padding:24px;
  text-align:center;
  color:#9ca3af;
  font-size:14px;
}

.typing-indicator { 
  padding:16px 24px; 
  display:flex; 
  align-items:center; 
  /* background:#f9fafb; */
  /* border-bottom:1px solid #f3f4f6; */
  color:#6b7280; 
  font-size:14px; 
}
.typing-indicator .typing-dots { display:flex; gap:4px; }
.typing-indicator .typing-dots span { width:6px; height:6px; border-radius:50%; background:#9ca3af; animation:typing 1.4s infinite; }
.typing-indicator .typing-dots span:nth-child(2) { animation-delay:0.2s; }
.typing-indicator .typing-dots span:nth-child(3) { animation-delay:0.4s; }

@keyframes typing {
  0%, 60%, 100% { opacity:0.3; transform:translateY(0); }
  30% { opacity:1; transform:translateY(-4px); }
}

/* composer is visually separated and sticky to bottom */
composer { }

/* simple select styling fallback */
select { padding:6px 12px; border-radius:6px; border:1px solid #e5e7eb }

@media (max-width:768px) {
  .chat-wrapper { flex-direction:column; }
  .chat-wrapper .sidebar { width:100%; border-right:none; border-bottom:1px solid #e5e7eb }
  .chat-panel { margin: 0; border-radius: 0; }
}

</style>