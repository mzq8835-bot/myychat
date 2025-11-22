<template>
  <div class="composer">
    <div class="composer-wrapper">
      <div class="input-card">
        <div class="input-header">
          <div class="model-selector-wrapper" ref="modelSelectorRef">
            <div class="model-selector" @click.stop="toggleModelMenu">
              <span class="model-name">{{ currentModelLabel }}</span>
              <svg class="chevron-icon" :class="{rotated: showModelMenu}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <div v-if="showModelMenu" class="model-menu">
              <div 
                v-for="model in modelOptions" 
                :key="model.value" 
                class="model-option" 
                :class="{selected: model.value === localModel}"
                @click.stop="selectModel(model.value)"
              >
                {{ model.label }}
              </div>
            </div>
          </div>

          <div class="search-toggle" :class="{active: useInternetSearch}" @click="useInternetSearch = !useInternetSearch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>联网搜索</span>
          </div>
        </div>

        <div v-if="images.length > 0" class="image-preview-container">
          <div v-for="(img, idx) in images" :key="idx" class="image-preview-item">
            <img :src="img.dataUrl" alt="预览图片" />
            <button class="remove-image-btn" @click="removeImage(idx)" title="删除图片">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="input-area">
          <textarea
            ref="textareaRef"
            v-model="text"
            :disabled="isLoading"
            placeholder="可输入说点什么，也可以贴图或拖拽文件至此处 (Shift + Enter = 换行)"
            @keydown.enter.exact.prevent="onSubmit"
            @paste="onPaste"
            rows="1"
          ></textarea>
        </div>

        <div class="input-footer">
          <div class="left-actions">
            <label for="file-upload" class="icon-btn" title="上传附件">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </label>
            <input id="file-upload" type="file" multiple @change="onFilesSelected" />
            
            <button class="icon-btn" title="图片识别">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button class="icon-btn" title="文本润色">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          </div>

          <button class="send-btn" :disabled="(!text.trim() && images.length === 0) || isLoading" @click="onSubmit">
            <svg v-if="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Composer',
  props: {
    modelOptions: { type: Array, required: true },
    selectedModel: { type: String, default: 'gpt-4o' },
    isLoading: { type: Boolean, default: false }
  },
  emits: ['send', 'upload-files', 'update:selectedModel'],
  setup(props, { emit }){
    const text = ref('')
    const textareaRef = ref(null)
    const localModel = ref(props.selectedModel)
    const useInternetSearch = ref(false)
    const deepThinking = ref(false)
    const images = ref([])
    const showModelMenu = ref(false)
    const modelSelectorRef = ref(null)

    watch(()=>props.selectedModel, v => localModel.value = v)

    const currentModelLabel = computed(() => {
      const m = props.modelOptions.find(o => o.value === localModel.value)
      return m ? m.label : localModel.value
    })

    function toggleModelMenu() {
      showModelMenu.value = !showModelMenu.value
    }

    function selectModel(value) {
      localModel.value = value
      showModelMenu.value = false
      emit('update:selectedModel', value)
    }

    function handleClickOutside(event) {
      if (modelSelectorRef.value && !modelSelectorRef.value.contains(event.target)) {
        showModelMenu.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    function onSubmit(){
      const payload = {
        text: text.value.trim(),
        model: localModel.value,
        use_internet_search: useInternetSearch.value,
        deep_thinking: deepThinking.value,
        images: images.value
      }
      emit('send', payload)
      text.value = ''
      images.value = []
    }

    function onFilesSelected(e){
      const files = Array.from(e.target.files)
      if (files.length) emit('upload-files', files)
      e.target.value = null
    }

    async function onPaste(e) {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            await addImageFile(file)
          }
        }
      }
    }

    async function addImageFile(file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        images.value.push({
          dataUrl: e.target.result,
          file: file,
          name: file.name || 'pasted-image.png',
          type: file.type
        })
      }
      reader.readAsDataURL(file)
    }

    function removeImage(index) {
      images.value.splice(index, 1)
    }

    return {
      text,
      textareaRef,
      localModel,
      useInternetSearch,
      deepThinking,
      images,
      showModelMenu,
      modelSelectorRef,
      currentModelLabel,
      toggleModelMenu,
      selectModel,
      onSubmit,
      onFilesSelected,
      onPaste,
      removeImage
    }
  }
}
</script>

<style scoped>
.composer {
  padding: 24px;
  background: transparent;
  position: relative;
  z-index: 10;
}

.composer-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.input-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}

.input-card:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
}

.input-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.model-selector-wrapper {
  position: relative;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f3f4f6;
  border-radius: 8px;
  cursor: pointer;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  user-select: none;
  transition: background 0.2s;
}

.model-selector:hover {
  background: #e5e7eb;
}

.model-selector:active {
  background: #d1d5db;
}

.chevron-icon {
  transition: transform 0.2s;
  color: #6b7280;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.model-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 4px;
  min-width: 180px;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.model-option {
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.model-option:hover {
  background: #f3f4f6;
}

.model-option.selected {
  background: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.search-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  font-size: 13px;
  transition: all 0.2s;
}

.search-toggle:hover {
  background: #f3f4f6;
}

.search-toggle.active {
  color: #3b82f6;
  background: #eff6ff;
}

.input-area {
  width: 100%;
}

textarea {
  width: 100%;
  min-height: 40px;
  max-height: 200px;
  padding: 8px 0;
  border: none;
  outline: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  color: #1f2937;
  font-family: inherit;
  background: transparent;
}

textarea::placeholder {
  color: #9ca3af;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.left-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 6px;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

input[type="file"] {
  display: none;
}

.send-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.image-preview-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0;
}

.image-preview-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-image-btn:hover {
  background: rgba(0, 0, 0, 0.7);
}

@media (max-width: 768px) {
  .composer {
    padding: 16px;
  }
  .input-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
