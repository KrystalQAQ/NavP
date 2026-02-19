<script setup>
import { ref, onMounted } from 'vue'
import { uploadFile } from '../api.js'

const props = defineProps({
  settings: { type: Object, default: () => ({}) },
  token: { type: String, default: '' },
})

const emit = defineEmits(['save', 'close'])

const bgType = ref('default')
const bgColor = ref('#F5F5F4')
const bgImage = ref('')
const bgOverlay = ref(30)
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref(null)

const presetColors = [
  { color: '#F5F5F4', name: '默认灰' },
  { color: '#FDF6EC', name: '暖米' },
  { color: '#EFF6FF', name: '浅蓝' },
  { color: '#ECFDF5', name: '薄荷' },
  { color: '#F5F3FF', name: '淡紫' },
  { color: '#FFF1F2', name: '柔粉' },
  { color: '#FEF9C3', name: '鹅黄' },
  { color: '#1A1A2E', name: '深夜蓝' },
  { color: '#0F172A', name: '墨黑' },
]

const imgPreviewError = ref(false)

onMounted(() => {
  bgType.value = props.settings.bg_type || 'default'
  bgColor.value = props.settings.bg_color || '#F5F5F4'
  bgImage.value = props.settings.bg_image || ''
  bgOverlay.value = Number(props.settings.bg_overlay) || 30
})

function selectPresetColor(color) {
  bgColor.value = color
  bgType.value = 'color'
}

function onImgInput() {
  imgPreviewError.value = false
  if (bgImage.value.trim()) {
    bgType.value = 'image'
  }
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  uploadError.value = ''
  uploading.value = true
  try {
    const data = await uploadFile(props.token, file)
    bgImage.value = data.url
    imgPreviewError.value = false
    bgType.value = 'image'
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function handleSubmit() {
  emit('save', {
    bg_type: bgType.value,
    bg_color: bgColor.value,
    bg_image: bgImage.value.trim(),
    bg_overlay: String(bgOverlay.value),
  })
}

function handleOverlayClick(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <div class="modal-overlay" @click="handleOverlayClick" @keydown.esc="emit('close')">
    <div class="modal" role="dialog" aria-labelledby="settings-title">
      <div class="modal-header">
        <h2 id="settings-title">背景设置</h2>
        <button class="close-btn" @click="emit('close')" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Background type -->
        <div class="form-group">
          <label class="form-label">背景类型</label>
          <div class="type-tabs">
            <button
              class="type-tab"
              :class="{ active: bgType === 'default' }"
              @click="bgType = 'default'"
            >
              默认
            </button>
            <button
              class="type-tab"
              :class="{ active: bgType === 'color' }"
              @click="bgType = 'color'"
            >
              纯色
            </button>
            <button
              class="type-tab"
              :class="{ active: bgType === 'image' }"
              @click="bgType = 'image'"
            >
              图片
            </button>
          </div>
        </div>

        <!-- Color picker -->
        <div v-if="bgType === 'color'" class="form-group">
          <label class="form-label">选择颜色</label>
          <div class="color-row">
            <input type="color" v-model="bgColor" class="color-picker" />
            <span class="color-hex">{{ bgColor }}</span>
          </div>
          <div class="preset-colors">
            <button
              v-for="preset in presetColors"
              :key="preset.color"
              class="preset-swatch"
              :class="{ active: bgColor === preset.color }"
              :style="{ background: preset.color }"
              :title="preset.name"
              @click="selectPresetColor(preset.color)"
            >
              <svg
                v-if="bgColor === preset.color"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                class="check-icon"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Image URL + Upload -->
        <div v-if="bgType === 'image'" class="form-group">
          <label class="form-label">图片地址</label>
          <div class="img-input-row">
            <input
              v-model="bgImage"
              type="text"
              class="text-input"
              placeholder="https://example.com/bg.jpg"
              @input="onImgInput"
            />
            <button
              class="btn-upload"
              :disabled="uploading"
              @click="fileInput?.click()"
            >
              <svg v-if="!uploading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span v-if="uploading" class="upload-spinner"></span>
              {{ uploading ? '上传中' : '上传' }}
            </button>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileUpload"
            />
          </div>
          <div v-if="uploadError" class="img-error">{{ uploadError }}</div>
          <div v-if="bgImage.trim() && !imgPreviewError" class="img-preview">
            <img
              :src="bgImage"
              alt="背景预览"
              @error="imgPreviewError = true"
            />
          </div>
          <div v-if="imgPreviewError" class="img-error">图片加载失败，请检查地址</div>

          <label class="form-label" style="margin-top: 16px">蒙层透明度</label>
          <div class="slider-row">
            <input
              type="range"
              v-model.number="bgOverlay"
              min="0"
              max="80"
              step="5"
              class="slider"
            />
            <span class="slider-value">{{ bgOverlay }}%</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-save" @click="handleSubmit">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 440px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
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
  padding: 20px 24px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group:last-child {
  margin-bottom: 0;
}
.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-secondary);
  margin-bottom: 8px;
}

/* Type tabs */
.type-tabs {
  display: flex;
  gap: 6px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: 3px;
}
.type-tab {
  flex: 1;
  padding: 7px 0;
  border-radius: 7px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition);
  text-align: center;
}
.type-tab.active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}
.type-tab:hover:not(.active) {
  color: var(--color-text);
}

/* Color picker */
.color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.color-picker {
  width: 40px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px;
  background: var(--color-surface);
}
.color-hex {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

/* Preset swatches */
.preset-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preset-swatch {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.preset-swatch:hover {
  transform: scale(1.1);
}
.preset-swatch.active {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.3);
}
.check-icon {
  width: 16px;
  height: 16px;
  color: #fff;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

/* Text input */
.img-input-row {
  display: flex;
  gap: 8px;
}
.img-input-row .text-input {
  flex: 1;
  min-width: 0;
}
.btn-upload {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition);
}
.btn-upload:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
.btn-upload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.upload-icon {
  width: 16px;
  height: 16px;
}
.upload-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.text-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  outline: none;
  transition: border-color var(--transition);
}
.text-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

/* Image preview */
.img-preview {
  margin-top: 10px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--color-border);
  max-height: 140px;
}
.img-preview img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
}
.img-error {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--color-error);
}

/* Slider */
.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--color-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  cursor: pointer;
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
}
.slider-value {
  font-family: var(--font-heading);
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  min-width: 36px;
  text-align: right;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 20px;
}
.btn-cancel {
  padding: 9px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
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
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background var(--transition);
}
.btn-save:hover {
  background: var(--color-accent);
}

@media (max-width: 500px) {
  .modal {
    max-width: 100%;
  }
}
</style>
