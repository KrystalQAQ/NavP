<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  link: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
})

const emit = defineEmits(['save', 'close'])

const title = ref('')
const url = ref('')
const category = ref('')
const note = ref('')
const pinned = ref(false)
const error = ref('')
const titleInput = ref(null)
const visible = ref(false)

const isEditing = !!props.link

onMounted(() => {
  if (props.link) {
    title.value = props.link.title
    url.value = props.link.url
    category.value = props.link.category
    note.value = props.link.note || ''
    pinned.value = !!props.link.pinned
  }
  nextTick(() => {
    visible.value = true
    titleInput.value?.focus()
  })
})

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleClose() {
  visible.value = false
  setTimeout(() => emit('close'), 200)
}

function handleSubmit() {
  error.value = ''
  if (!title.value.trim()) {
    error.value = '请输入标题'
    return
  }
  if (!url.value.trim()) {
    error.value = '请输入 URL'
    return
  }
  let finalUrl = url.value.trim()
  if (!/^https?:\/\//.test(finalUrl)) {
    finalUrl = 'https://' + finalUrl
  }
  emit('save', {
    title: title.value.trim(),
    url: finalUrl,
    category: category.value.trim() || '未分类',
    note: note.value.trim(),
    pinned: pinned.value,
  })
}

function handleKeydown(e) {
  if (e.key === 'Escape') handleClose()
}
</script>

<template>
  <Transition name="overlay">
    <div
      v-if="visible"
      class="modal-overlay"
      @click="handleOverlayClick"
      @keydown="handleKeydown"
    >
      <Transition name="modal" appear>
        <div class="modal" role="dialog" aria-labelledby="modal-title">
          <div class="accent-bar"></div>
          <div class="modal-header">
            <h2 id="modal-title">{{ isEditing ? '编辑链接' : '添加链接' }}</h2>
            <button class="close-btn" @click="handleClose" aria-label="关闭">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="link-title">标题</label>
              <input
                id="link-title"
                ref="titleInput"
                v-model="title"
                type="text"
                placeholder="网站名称"
              />
            </div>

            <div class="form-group">
              <label for="link-url">URL</label>
              <input
                id="link-url"
                v-model="url"
                type="text"
                placeholder="https://example.com"
              />
            </div>

            <div class="form-row">
              <div class="form-group form-group-flex">
                <label for="link-category">分类</label>
                <input
                  id="link-category"
                  v-model="category"
                  type="text"
                  placeholder="未分类"
                  list="category-list"
                />
                <datalist id="category-list">
                  <option v-for="cat in categories" :key="cat" :value="cat" />
                </datalist>
              </div>

              <div v-if="isEditing" class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="pinned" />
                  <span>置顶</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label for="link-note">备注</label>
              <textarea
                id="link-note"
                v-model="note"
                placeholder="简短描述（可选）"
                rows="2"
              />
            </div>

            <div v-if="error" class="error-msg">{{ error }}</div>

            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="handleClose">
                取消
              </button>
              <button type="submit" class="btn-save">保存</button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
/* Overlay transitions */
.overlay-enter-active {
  transition: opacity 0.2s ease;
}
.overlay-leave-active {
  transition: opacity 0.15s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* Modal transitions */
.modal-enter-active {
  transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-accent), var(--color-accent-hover));
  z-index: 1;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}
.modal-header h2 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
}
.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition);
}
.close-btn svg {
  width: 20px;
  height: 20px;
}
.close-btn:hover {
  background: var(--color-bg);
}
.modal-body {
  padding: 20px 24px 24px;
  overflow-y: auto;
  flex: 1;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-secondary);
  margin-bottom: 6px;
}
.form-group input[type='text'],
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
  resize: vertical;
}
.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}
.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}
.form-group-flex {
  flex: 1;
}
.checkbox-group {
  padding-bottom: 4px;
}
.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
}
.checkbox-label input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-accent);
  cursor: pointer;
}
.error-msg {
  color: var(--color-error);
  font-size: 0.85rem;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius-sm);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-cancel:hover {
  background: var(--color-bg);
}
.btn-save {
  padding: 9px 24px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background var(--transition), transform var(--transition-fast);
}
.btn-save:hover {
  background: var(--color-accent);
}
.btn-save:active {
  transform: scale(0.97);
}

@media (max-width: 500px) {
  .modal-overlay {
    align-items: flex-end;
    padding: 0;
  }
  .modal {
    max-width: 100%;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    max-height: 90vh;
  }
  .modal-enter-from {
    opacity: 0;
    transform: translateY(100%);
  }
  .modal-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
  .modal-enter-active {
    transition: opacity 0.25s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .modal-leave-active {
    transition: opacity 0.15s ease, transform 0.2s ease;
  }
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  .form-group input[type='text'],
  .form-group textarea {
    padding: 12px 14px;
  }
  .modal-body {
    padding: 20px 20px 24px;
  }
}
</style>
