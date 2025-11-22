<template>
  <div class="welcome-view">
    <div class="welcome-header">
      <div class="logo-large">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="sun-gradient-large" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#8b5cf6" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#sun-gradient-large)" />
          <path d="M12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z" fill="white" fill-opacity="0.8"/>
        </svg>
      </div>
      <div class="greeting">
        <h1>下午好，闵志清</h1>
        <p>午后微风拂面，愿你成长与突破😋</p>
      </div>
    </div>

    <div class="content-grid">
      <!-- Daily Hotspots -->
      <div class="card hotspot-card">
        <h3>今日热点</h3>
        <ul class="hotspot-list">
          <li v-for="(item, index) in hotspots" :key="index">
            <span class="rank" :class="{top: index < 3}">{{ index + 1 }}</span>
            <span class="text">{{ item }}</span>
          </li>
        </ul>
      </div>

      <!-- Common Tools -->
      <div class="card tools-card">
        <h3>常用工具</h3>
        <div class="tool-grid">
          <div v-for="tool in tools" :key="tool.name" class="tool-item">
            <div class="tool-icon">
              <img :src="tool.icon" :alt="tool.name" />
            </div>
            <div class="tool-info">
              <h4>{{ tool.name }}</h4>
              <p>{{ tool.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Featured Agents -->
      <div class="card agents-card">
        <h3>精选智能体</h3>
        <div class="tool-grid">
          <div v-for="agent in agents" :key="agent.name" class="tool-item">
             <div class="tool-icon">
              <img :src="agent.icon" :alt="agent.name" />
            </div>
            <div class="tool-info">
              <h4>{{ agent.name }}</h4>
              <p>{{ agent.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-section">
      <div class="quick-actions">
        <button v-for="action in quickActions" :key="action.label" class="action-pill">
          <span class="icon">{{ action.icon }}</span>
          {{ action.label }}
        </button>
      </div>
      
      <div class="input-box-wrapper">
        <composer 
          :model-options="modelOptions" 
          :selected-model="selectedModel"
          @send="handleSend"
          @update:selectedModel="$emit('update:selectedModel', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Composer from './Composer.vue'

export default {
  name: 'WelcomeView',
  components: { Composer },
  props: {
    modelOptions: { type: Array, default: () => [] },
    selectedModel: { type: String, default: 'gpt-4o' }
  },
  emits: ['send', 'update:selectedModel'],
  data() {
    return {
      hotspots: [
        '杨斌：底数得质变 ——以新教育的ai次...',
        'AI时代"学习革命"，从教师培训开始 _...',
        'AI家教赛道升温，互联网大厂与教育...',
        '全国ai赋能教育研讨会在英特小学落...',
        '共建智慧教育新生态 这场大湾区ai+智...',
        '中南教育智能体矩阵重磅发布，首批1...'
      ],
      tools: [
        { name: '试卷分析', desc: '快速解析考试数据，提供...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=exam&backgroundColor=e0e7ff' },
        { name: '会议纪要整理', desc: '高效整理会议要点，自动...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=meeting&backgroundColor=dbeafe' },
        { name: '创意活动策划', desc: '专注于提供独特、创新的...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=idea&backgroundColor=ffedd5' }
      ],
      agents: [
        { name: '图表制作', desc: '智能推荐并生成适合数据...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=chart&backgroundColor=fce7f3' },
        { name: '试卷分析', desc: '快速解析考试数据，提供...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=exam2&backgroundColor=d1fae5' },
        { name: '英语语法检查', desc: '智能英语语法助手，实时...', icon: 'https://api.dicebear.com/7.x/icons/svg?seed=grammar&backgroundColor=fef3c7' }
      ],
      quickActions: [
        { label: 'AI翻译', icon: '文' },
        { label: '图片识题', icon: '图' },
        { label: '文本润色', icon: '笔' },
        { label: '短视频脚本', icon: '影' },
        { label: '文档解读', icon: '书' }
      ]
    }
  },
  methods: {
    handleSend(payload) {
      this.$emit('send', payload)
    }
  }
}
</script>

<style scoped>
.welcome-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: #f8fafc;
  overflow-y: auto;
  height: 100%;
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 40px;
}

.greeting h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.greeting p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  width: 100%;
  max-width: 1000px;
  margin-bottom: 40px;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
}

.hotspot-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.hotspot-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
}

.hotspot-list li:hover {
  color: #3b82f6;
}

.rank {
  font-weight: 600;
  color: #9ca3af;
  width: 16px;
  text-align: center;
}

.rank.top {
  color: #ef4444;
}

.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.tool-item:hover {
  background: #f3f4f6;
}

.tool-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
}

.tool-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tool-info h4 {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.tool-info p {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.input-section {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.action-pill:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.input-box-wrapper {
  width: 100%;
}

/* Override Composer styles for this view if needed */
:deep(.composer) {
  padding: 0;
}
:deep(.input-card) {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
</style>
