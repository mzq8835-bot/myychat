<template>
  <div class="history-view">
    <div class="history-header">
      <div class="search-bar">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="请输入搜索关键字" 
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          搜索
        </button>
      </div>
      
      <div class="time-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value" 
          class="tab-btn" 
          :class="{active: activeTab === tab.value}"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div class="history-content">
      <div v-if="filteredConversations.length === 0" class="empty-state">
        <p>没有找到相关会话</p>
      </div>
      
      <div v-else class="history-list">
        <div v-for="conv in filteredConversations" :key="conv.id" class="history-item" @click="$emit('select', conv.id)">
          <div class="item-title">{{ conv.title || '未命名会话' }}</div>
          <div class="item-preview">{{ conv.lastMessage || '暂无消息' }}</div>
          <div class="item-meta">
            <span class="item-time">{{ formatTime(conv.updatedAt) }}</span>
            <span class="item-model">{{ conv.model }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'HistoryView',
  props: {
    conversations: { type: Array, required: true }
  },
  emits: ['select'],
  setup(props) {
    const searchQuery = ref('')
    const activeTab = ref('today')
    
    const tabs = [
      { label: '今天', value: 'today' },
      { label: '昨天', value: 'yesterday' },
      { label: '近7天', value: 'recent7' },
      { label: '7天前', value: 'older' }
    ]

    const filteredConversations = computed(() => {
      let filtered = props.conversations
      
      // Search filter
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(c => 
          (c.title && c.title.toLowerCase().includes(query)) ||
          (c.messages && c.messages.some(m => m.content.toLowerCase().includes(query)))
        )
      }
      
      // Time filter
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const last7Days = new Date(today)
      last7Days.setDate(last7Days.getDate() - 7)
      
      filtered = filtered.filter(c => {
        const date = new Date(c.updatedAt)
        const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate())
        
        if (activeTab.value === 'today') {
          return dateZero.getTime() === today.getTime()
        } else if (activeTab.value === 'yesterday') {
          return dateZero.getTime() === yesterday.getTime()
        } else if (activeTab.value === 'recent7') {
          return dateZero < yesterday && dateZero >= last7Days
        } else if (activeTab.value === 'older') {
          return dateZero < last7Days
        }
        return true
      })
      
      return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    })

    function formatTime(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    function handleSearch() {
      // Trigger search logic if needed, currently computed handles it
    }

    return {
      searchQuery,
      activeTab,
      tabs,
      filteredConversations,
      formatTime,
      handleSearch
    }
  }
}
</script>

<style scoped>
.history-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 100%;
  overflow: hidden;
  padding: 40px;
}

.history-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;
}

.search-bar {
  display: flex;
  gap: 0;
  width: 100%;
  max-width: 600px;
}

.search-bar input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #3b82f6;
  border-right: none;
  border-radius: 6px 0 0 6px;
  outline: none;
  font-size: 14px;
}

.search-bar .search-btn {
  padding: 10px 24px;
  background: #3b82f6;
  color: #fff;
  border: 1px solid #3b82f6;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.time-tabs {
  display: flex;
  gap: 12px;
}

.tab-btn {
  padding: 6px 24px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #6b7280;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #3b82f6;
  border-color: #3b82f6;
}

.tab-btn.active {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f9fafb;
  border-radius: 8px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.item-preview {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.empty-state {
  text-align: center;
  color: #9ca3af;
  margin-top: 40px;
}
</style>
