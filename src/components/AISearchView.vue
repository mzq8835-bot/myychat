<template>
  <div class="ai-search-view">
    <div class="search-container">
      <div class="search-header">
        <div class="search-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
             <defs>
              <linearGradient id="search-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="url(#search-gradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 8L17 6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
            <path d="M17 10L19 9" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h1>AI 搜索</h1>
        <p>实时资讯 资源整合 智能搜索</p>
      </div>

      <div class="search-input-wrapper">
        <composer 
          :model-options="modelOptions" 
          :selected-model="selectedModel"
          @send="handleSearch"
          @update:selectedModel="$emit('update:selectedModel', $event)"
        />
      </div>

      <div class="search-suggestions">
        <!-- Placeholder for search suggestions or history -->
      </div>
    </div>
  </div>
</template>

<script>
import Composer from './Composer.vue'

export default {
  name: 'AISearchView',
  components: { Composer },
  props: {
    modelOptions: { type: Array, default: () => [] },
    selectedModel: { type: String, default: 'gpt-4o' }
  },
  emits: ['search', 'update:selectedModel'],
  methods: {
    handleSearch(payload) {
      // Force internet search on
      payload.use_internet_search = true
      this.$emit('search', payload)
    }
  }
}
</script>

<style scoped>
.ai-search-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: #f8fafc;
  height: 100%;
}

.search-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  margin-top: -100px; /* Visual offset */
}

.search-header {
  text-align: center;
}

.search-logo {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.search-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.search-header p {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.search-input-wrapper {
  width: 100%;
}

:deep(.composer) {
  padding: 0;
}

:deep(.input-card) {
  box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  border-color: #bfdbfe;
}
</style>
