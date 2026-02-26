<script setup>
import { computed } from 'vue'

const props = defineProps({
  link: { type: Object, required: true },
})

const emit = defineEmits(['edit', 'delete', 'toggle-pin'])

const domain = computed(() => {
  try {
    return new URL(props.link.url).hostname.replace('www.', '')
  } catch {
    return ''
  }
})

const faviconUrl = computed(() => {
  if (!domain.value) return ''
  // return `https://www.google.com/s2/favicons?domain=${domain.value}&sz=32`
  return `https://0x3.com/icon?host=${domain.value}`
})

const initial = computed(() => {
  return (props.link.title || '?')[0].toUpperCase()
})

const iconColor = computed(() => {
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  ]
  let hash = 0
  const str = props.link.title || ''
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
})

function faviconError(e) {
  e.target.style.display = 'none'
  e.target.nextElementSibling.style.display = 'flex'
}

function handleClick() {
  window.open(props.link.url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <div class="card" :class="{ 'card--pinned': link.pinned }" @click="handleClick">
    <div class="card-header">
      <div class="icon-wrapper">
        <img
          :src="faviconUrl"
          :alt="link.title"
          class="favicon"
          loading="lazy"
          @error="faviconError"
        />
        <div
          class="icon-fallback"
          :style="{ background: iconColor }"
          style="display: none"
        >
          {{ initial }}
        </div>
      </div>
      <div class="card-info">
        <h3 class="card-title">{{ link.title }}</h3>
        <p class="card-domain">{{ domain }}</p>
      </div>
    </div>
    <p v-if="link.note" class="card-note">{{ link.note }}</p>

    <div class="card-actions" @click.stop>
      <button
        class="action-btn"
        :class="{ 'is-pinned': link.pinned }"
        @click="emit('toggle-pin', link)"
        :aria-label="link.pinned ? '取消置顶' : '置顶'"
        :title="link.pinned ? '取消置顶' : '置顶'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 17v5" />
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76z" />
        </svg>
      </button>
      <button
        class="action-btn"
        @click="emit('edit', link)"
        aria-label="编辑"
        title="编辑"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
      <button
        class="action-btn action-delete"
        @click="emit('delete', link.id)"
        aria-label="删除"
        title="删除"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: border-color var(--transition-slow), box-shadow var(--transition-slow), transform var(--transition-slow);
  overflow: hidden;
}
.card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.card:active {
  transform: translateY(0);
}

/* Pinned card accent bar */
.card--pinned {
  border-left: 3px solid var(--color-accent);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon-wrapper {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.favicon {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}
.icon-fallback {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
}
.card-info {
  min-width: 0;
  flex: 1;
}
.card-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-domain {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-note {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Actions */
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity var(--transition), transform var(--transition);
}
.card:hover .card-actions {
  opacity: 1;
  transform: scale(1);
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.action-btn svg {
  width: 14px;
  height: 14px;
}
.action-btn:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  transform: scale(1.05);
}
.action-btn:active {
  transform: scale(0.92);
}
.action-btn.is-pinned {
  color: var(--color-accent);
}
.action-delete:hover {
  color: var(--color-error);
  border-color: var(--color-error);
}

@media (max-width: 768px) {
  .card {
    padding: 12px;
  }
  .card-actions {
    opacity: 1;
    transform: scale(1);
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-radius: var(--radius-sm);
    padding: 2px;
  }
  .action-btn {
    min-width: 32px;
    min-height: 32px;
  }
  .card:active {
    transform: scale(0.98);
  }
}
</style>
