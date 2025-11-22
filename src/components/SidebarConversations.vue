<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-area">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="sun-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#sun-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="logo-text">MyyGPT</span>
      </div>
      <button class="new-btn" @click="$emit('new')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新建对话
      </button>
    </div>

    <div class="sidebar-nav">
      <div class="nav-item" @click="$emit('ai-search')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>AI 搜索</span>
      </div>
    </div>

    <!-- 我的对话 -->
    <div class="section">
      <div class="section-header" @click="toggleConversations">
        <div class="header-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="section-title">我的对话</span>
        </div>
        <svg class="chevron" :class="{collapsed: !conversationsExpanded}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div v-show="conversationsExpanded" class="groups" ref="scrollContainer" @scroll="handleScroll">
        <div v-if="conversations.length === 0 && !loading" class="empty-state">
          <p>暂无会话</p>
        </div>
        <!-- Flattened list for cleaner look, or keep grouped but style minimally -->
        <div v-for="group in grouped" :key="group.date" class="group">
          <!-- <div class="group-title">{{ group.date }}</div> -->
          <ul>
            <li v-for="conv in group.items" :key="conv.id" :class="{active: conv.id === currentId}">
              <div class="conv-item" @click="$emit('select', conv.id)">
                <div v-if="editingId === conv.id" class="conv-edit" @click.stop>
                  <input
                    ref="editInput"
                    v-model="editingName"
                    @keyup.enter="saveEdit(conv.id)"
                    @keyup.esc="cancelEdit"
                    @blur="saveEdit(conv.id)"
                    class="edit-input"
                  />
                </div>
                <div v-else class="conv-title">{{ conv.title || '未命名会话' }}</div>
              </div>
              <div class="conv-actions">
                <button
                  class="action-icon-btn"
                  @click.stop="startEdit(conv.id, conv.title)"
                  title="编辑名称"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  class="action-icon-btn delete-btn"
                  @click.stop="confirmDelete(conv.id, conv.title)"
                  title="删除会话"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
        </div>

        <!-- View All Button -->
        <div v-if="showViewAll" class="view-all-container">
          <button class="view-all-btn" @click="$emit('view-all')">
            查看全部
          </button>
        </div>
      </div>
    </div>

    <!-- 我的智能体 -->
    <div class="section">
      <div class="section-header" @click="toggleAgents">
        <div class="header-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
          <span class="section-title">我的智能体</span>
        </div>
        <svg class="chevron" :class="{collapsed: !agentsExpanded}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      <div v-show="agentsExpanded" class="groups">
        <div class="nav-item sub-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>发现智能体</span>
        </div>
        <div class="nav-item sub-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span>试卷分析</span>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="avatar">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        </div>
        <span class="username">闵志清</span>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'SidebarConversations',
  props: {
    conversations: { type: Array, required: true },
    currentId: { type: [Number, String], default: null },
    loading: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: true }
  },
  data() {
    return {
      pageNum: 1,
      pageSize: 20,
      conversationsExpanded: true,
      agentsExpanded: true,
      editingId: null,
      editingName: '',
      originalName: ''
    }
  },
  computed: {
    grouped() {
      // Sort all conversations by updatedAt desc
      const sorted = [...this.conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      
      // Take top 6 for display
      const displayItems = sorted.slice(0, 6)
      
      // group by date (YYYY-MM-DD)
      const map = {}
      for (const c of displayItems) {
        const d = new Date(c.updatedAt)
        const key = d.toLocaleDateString()
        if (!map[key]) map[key] = []
        map[key].push(c)
      }
      const groups = Object.keys(map).map(date => ({ date, items: map[date] })) // items are already sorted
      groups.sort((a,b) => new Date(b.date) - new Date(a.date))
      return groups
    },
    showViewAll() {
      return this.conversations.length > 6
    }
  },
  methods: {
    handleScroll(e) {
      const container = e.target
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (!this.loading && this.hasMore) {
          this.loadMore()
        }
      }
    },
    loadMore() {
      this.pageNum++
      this.$emit('load-more', {
        pageNum: this.pageNum,
        pageSize: this.pageSize
      })
    },
    resetPage() {
      this.pageNum = 1
    },
    toggleConversations() {
      this.conversationsExpanded = !this.conversationsExpanded
    },
    toggleAgents() {
      this.agentsExpanded = !this.agentsExpanded
    },
    startEdit(id, title) {
      this.editingId = id
      this.editingName = title || ''
      this.originalName = title || ''
      this.$nextTick(() => {
        const input = this.$refs.editInput?.[0] || this.$refs.editInput
        if (input) {
          input.focus()
          input.select()
        }
      })
    },
    cancelEdit() {
      this.editingId = null
      this.editingName = ''
    },
    async saveEdit(id) {
      if (!this.editingName.trim()) {
        this.cancelEdit()
        return
      }
      // Only emit if name changed
      if (this.editingId === id && this.editingName.trim() !== this.originalName) {
        this.$emit('edit', {
          sessionId: id,
          sessionName: this.editingName.trim()
        })
      }
      this.cancelEdit()
    },
    confirmDelete(id, title) {
      if (confirm(`确定要删除会话"${title || '未命名'}"吗？此操作不可恢复。`)) {
        this.$emit('delete', id)
      }
    }
  }
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  padding: 20px 16px;
  background: #f5f7fa; /* Match global background */
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.new-btn {
  background: #fff;
  color: #3b82f6;
  border: 1px solid #bfdbfe;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-start;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.05);
}

.new-btn:hover {
  background: #eff6ff;
  border-color: #60a5fa;
  transform: translateY(-1px);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #4b5563;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.nav-item.sub-item {
  padding-left: 12px;
  font-size: 13px;
  color: #6b7280;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  border-radius: 6px;
  color: #4b5563;
  transition: background 0.2s;
}

.section-header:hover {
  background: #e5e7eb;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.chevron {
  transition: transform 0.2s;
  color: #9ca3af;
}

.chevron.collapsed {
  transform: rotate(-90deg);
}

.groups {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 300px;
  padding-left: 12px; /* Indent content */
}

.groups::-webkit-scrollbar {
  width: 4px;
}
.groups::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.empty-state {
  padding: 12px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 0;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  position: relative;
  color: #4b5563;
  font-size: 14px;
}

li:hover {
  background: #e5e7eb;
  color: #1f2937;
}

li.active {
  background: #eff6ff;
  color: #3b82f6;
  box-shadow: none;
}

.conv-item {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.conv-title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
}

.conv-actions {
  display: none;
  align-items: center;
  gap: 2px;
}

li:hover .conv-actions {
  display: flex;
}

.action-icon-btn {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-btn:hover {
  background: #d1d5db;
  color: #4b5563;
}

.action-icon-btn.delete-btn:hover {
  background: #fee2e2;
  color: #dc2626;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-profile:hover {
  background: #e5e7eb;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #e0e7ff;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-height: none;
    padding: 16px;
  }
  .groups {
    max-height: 200px;
  }
}

.view-all-container {
  padding: 12px 0 0 0;
}

.view-all-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #4b5563;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.view-all-btn:hover {
  background: #f9fafb;
  color: #1f2937;
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
</style>
