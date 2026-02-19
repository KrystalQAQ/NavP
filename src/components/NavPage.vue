<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import {
  ensureNavUser,
  getLinks,
  getCategoryOrder,
  saveCategoryOrder,
  saveLinkOrder,
  addLink,
  updateLink,
  deleteLink,
  togglePin,
  getSettings,
  saveSettings,
} from '../api.js'
import LinkCard from './LinkCard.vue'
import LinkModal from './LinkModal.vue'
import SettingsPanel from './SettingsPanel.vue'

const emit = defineEmits(['logout'])
const token = inject('token')
const user = inject('user')

const allLinks = ref([])
const loading = ref(true)
const navUserId = ref(null)
const showModal = ref(false)
const editingLink = ref(null)
const categoryOrderMap = ref({})

const pinnedLinks = ref([])
const sections = ref([])
const showSettings = ref(false)
const userSettings = ref({})

// --- Background ---
const bgStyle = computed(() => {
  const type = userSettings.value.bg_type
  if (type === 'color') {
    return { backgroundColor: userSettings.value.bg_color || '#F5F5F4' }
  }
  if (type === 'image' && userSettings.value.bg_image) {
    return {
      backgroundImage: `url(${userSettings.value.bg_image})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }
  }
  return {}
})

const overlayOpacity = computed(() => {
  if (userSettings.value.bg_type !== 'image') return 0
  return (Number(userSettings.value.bg_overlay) || 30) / 100
})

const hasImageBg = computed(() => userSettings.value.bg_type === 'image' && !!userSettings.value.bg_image)

// --- Search engine ---
const engines = [
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', placeholder: '百度一下' },
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', placeholder: 'Search Google' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', placeholder: '搜索 Bing' },
]

const activeEngineId = ref(localStorage.getItem('nav_engine') || 'baidu')
const searchText = ref('')

const currentEngine = computed(() =>
  engines.find((e) => e.id === activeEngineId.value) || engines[0]
)

function switchEngine(id) {
  activeEngineId.value = id
  localStorage.setItem('nav_engine', id)
}

function handleSearch() {
  const q = searchText.value.trim()
  if (!q) return
  window.open(currentEngine.value.url + encodeURIComponent(q), '_blank', 'noopener')
  searchText.value = ''
}

// --- Categories & links ---
const categories = computed(() => {
  const cats = new Set(allLinks.value.map((l) => l.category).filter(Boolean))
  return [...cats].sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

function buildSections() {
  pinnedLinks.value = allLinks.value.filter((l) => l.pinned)

  const groups = {}
  for (const link of allLinks.value) {
    if (link.pinned) continue
    const cat = link.category || '未分类'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(link)
  }

  for (const cat in groups) {
    groups[cat].sort((a, b) => a.sort_order - b.sort_order)
  }

  const entries = Object.entries(groups)
  entries.sort(([a], [b]) => {
    const orderA = categoryOrderMap.value[a] ?? 9999
    const orderB = categoryOrderMap.value[b] ?? 9999
    if (orderA !== orderB) return orderA - orderB
    if (a === '未分类') return 1
    if (b === '未分类') return -1
    return a.localeCompare(b, 'zh-CN')
  })

  sections.value = entries.map(([name, links]) => ({ name, links }))
}

async function loadLinks() {
  try {
    loading.value = true
    navUserId.value = await ensureNavUser(token.value, user.value.username)

    const [linksResult, orderResult, settingsResult] = await Promise.all([
      getLinks(token.value, navUserId.value),
      getCategoryOrder(token.value, navUserId.value),
      getSettings(token.value, navUserId.value),
    ])

    allLinks.value = linksResult.data || []

    const orderMap = {}
    if (orderResult.data) {
      for (const row of orderResult.data) {
        orderMap[row.category] = row.sort_order
      }
    }
    categoryOrderMap.value = orderMap

    if (settingsResult.data) {
      const s = {}
      for (const row of settingsResult.data) {
        s[row.setting_key] = row.setting_value
      }
      userSettings.value = s
    }

    buildSections()
  } catch (e) {
    console.error('Failed to load links:', e)
  } finally {
    loading.value = false
  }
}

function openAddModal() {
  editingLink.value = null
  showModal.value = true
}

function openEditModal(link) {
  editingLink.value = { ...link }
  showModal.value = true
}

async function handleSave(linkData) {
  try {
    if (editingLink.value && editingLink.value.id) {
      await updateLink(token.value, editingLink.value.id, linkData)
    } else {
      await addLink(token.value, navUserId.value, linkData)
    }
    showModal.value = false
    await loadLinks()
  } catch (e) {
    console.error('Save failed:', e)
  }
}

async function handleDelete(linkId) {
  if (!confirm('确定要删除这个链接吗？')) return
  try {
    await deleteLink(token.value, linkId)
    await loadLinks()
  } catch (e) {
    console.error('Delete failed:', e)
  }
}

async function handleTogglePin(link) {
  try {
    await togglePin(token.value, link.id, !link.pinned)
    await loadLinks()
  } catch (e) {
    console.error('Toggle pin failed:', e)
  }
}

async function onCategoryDragEnd() {
  const catNames = sections.value.map((s) => s.name)
  const newMap = {}
  catNames.forEach((name, i) => {
    newMap[name] = i
  })
  categoryOrderMap.value = newMap
  try {
    await saveCategoryOrder(token.value, navUserId.value, catNames)
  } catch (e) {
    console.error('Save category order failed:', e)
  }
}

async function onLinkDragEnd(section) {
  const linkIds = section.links.map((l) => l.id)
  try {
    await saveLinkOrder(token.value, linkIds)
  } catch (e) {
    console.error('Save link order failed:', e)
  }
}

async function onPinnedDragEnd() {
  const linkIds = pinnedLinks.value.map((l) => l.id)
  try {
    await saveLinkOrder(token.value, linkIds)
  } catch (e) {
    console.error('Save pinned order failed:', e)
  }
}

async function handleSaveSettings(settings) {
  try {
    await saveSettings(token.value, navUserId.value, settings)
    userSettings.value = { ...settings }
    showSettings.value = false
  } catch (e) {
    console.error('Save settings failed:', e)
  }
}

onMounted(loadLinks)
</script>

<template>
  <div class="nav-page" :style="bgStyle">
    <!-- Background overlay for image mode -->
    <div
      v-if="hasImageBg"
      class="bg-overlay"
      :style="{ opacity: overlayOpacity }"
    ></div>

    <!-- Header -->
    <header class="header" :class="{ 'header--glass': hasImageBg }">
      <div class="header-inner">
        <h1 class="logo">NavP</h1>
        <div class="header-actions">
          <button
            class="icon-btn"
            @click="showSettings = true"
            aria-label="背景设置"
            title="背景设置"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <button
            class="add-btn"
            @click="openAddModal"
            aria-label="添加链接"
            title="添加链接"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <div class="user-info">
            <span class="username">{{ user.username }}</span>
            <button
              class="logout-btn"
              @click="emit('logout')"
              aria-label="退出登录"
              title="退出登录"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <!-- Search engine box -->
      <div class="search-hero" :class="{ 'search-hero--glass': hasImageBg }">
        <div class="engine-tabs">
          <button
            v-for="engine in engines"
            :key="engine.id"
            class="engine-tab"
            :class="{ active: activeEngineId === engine.id }"
            @click="switchEngine(engine.id)"
          >
            {{ engine.name }}
          </button>
        </div>
        <form class="search-form" @submit.prevent="handleSearch">
          <input
            v-model="searchText"
            type="text"
            class="search-main-input"
            :placeholder="currentEngine.placeholder"
            autofocus
            aria-label="搜索"
          />
          <button type="submit" class="search-submit" aria-label="搜索">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </form>
      </div>

      <div v-if="loading" class="loading">
        <div class="spinner"></div>
      </div>

      <template v-else>
        <!-- Empty state -->
        <div v-if="allLinks.length === 0" class="empty-state">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="empty-icon"
          >
            <path
              d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101"
            />
            <path
              d="M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p>还没有添加任何链接</p>
          <button class="add-first-btn" @click="openAddModal">
            添加第一个链接
          </button>
        </div>

        <template v-else>
          <!-- Pinned section -->
          <section v-if="pinnedLinks.length > 0" class="section">
            <h2 class="section-title" :class="{ 'title--glass': hasImageBg }">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="section-icon"
              >
                <path d="M12 17v5" />
                <path
                  d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76z"
                />
              </svg>
              置顶
            </h2>
            <VueDraggable
              v-model="pinnedLinks"
              class="link-grid"
              :animation="200"
              :delay="150"
              :delay-on-touch-only="true"
              ghost-class="drag-ghost"
              @update="onPinnedDragEnd"
            >
              <LinkCard
                v-for="link in pinnedLinks"
                :key="link.id"
                :link="link"
                @edit="openEditModal"
                @delete="handleDelete"
                @toggle-pin="handleTogglePin"
              />
            </VueDraggable>
          </section>

          <!-- Category sections (draggable) -->
          <VueDraggable
            v-model="sections"
            :animation="250"
            handle=".section-drag-handle"
            ghost-class="section-drag-ghost"
            @update="onCategoryDragEnd"
          >
            <section
              v-for="section in sections"
              :key="section.name"
              class="section"
            >
              <h2 class="section-title" :class="{ 'title--glass': hasImageBg }">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  class="section-drag-handle"
                  aria-label="拖拽排序"
                >
                  <circle cx="9" cy="5" r="1.5" />
                  <circle cx="15" cy="5" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="19" r="1.5" />
                  <circle cx="15" cy="19" r="1.5" />
                </svg>
                {{ section.name }}
              </h2>
              <VueDraggable
                v-model="section.links"
                class="link-grid"
                :animation="200"
                :delay="150"
                :delay-on-touch-only="true"
                ghost-class="drag-ghost"
                @update="() => onLinkDragEnd(section)"
              >
                <LinkCard
                  v-for="link in section.links"
                  :key="link.id"
                  :link="link"
                  @edit="openEditModal"
                  @delete="handleDelete"
                  @toggle-pin="handleTogglePin"
                />
              </VueDraggable>
            </section>
          </VueDraggable>
        </template>
      </template>
    </main>

    <!-- Modal -->
    <LinkModal
      v-if="showModal"
      :link="editingLink"
      :categories="categories"
      @save="handleSave"
      @close="showModal = false"
    />
    <!-- Settings -->
    <SettingsPanel
      v-if="showSettings"
      :settings="userSettings"
      :token="token"
      @save="handleSaveSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<style scoped>
.nav-page {
  min-height: 100vh;
  background: var(--color-bg);
  position: relative;
}

/* Background overlay */
.bg-overlay {
  position: fixed;
  inset: 0;
  background: #000;
  z-index: 1;
  pointer-events: none;
}

/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}
.header--glass {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom-color: rgba(255, 255, 255, 0.2);
}
.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition), background var(--transition);
}
.icon-btn svg {
  width: 18px;
  height: 18px;
}
.icon-btn:hover {
  color: var(--color-text);
  background: var(--color-bg);
}
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: background var(--transition);
}
.add-btn svg {
  width: 18px;
  height: 18px;
}
.add-btn:hover {
  background: var(--color-accent);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.username {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color var(--transition), background var(--transition);
}
.logout-btn svg {
  width: 18px;
  height: 18px;
}
.logout-btn:hover {
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.08);
}

/* Content */
.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 28px 24px 60px;
  position: relative;
  z-index: 2;
}

/* Search hero */
.search-hero {
  max-width: 620px;
  margin: 8px auto 36px;
}
.search-hero--glass .search-form {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-color: rgba(255, 255, 255, 0.3);
}
.search-hero--glass .engine-tab {
  color: rgba(255, 255, 255, 0.7);
}
.search-hero--glass .engine-tab.active {
  background: rgba(255, 255, 255, 0.9);
  color: var(--color-primary);
}
.search-hero--glass .engine-tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.engine-tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 14px;
}
.engine-tab {
  padding: 5px 18px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid transparent;
}
.engine-tab.active {
  background: var(--color-primary);
  color: #fff;
}
.engine-tab:hover:not(.active) {
  background: var(--color-surface);
  border-color: var(--color-border);
}
.search-form {
  display: flex;
  align-items: center;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: 28px;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition), box-shadow var(--transition);
}
.search-form:focus-within {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.12), var(--shadow-md);
}
.search-main-input {
  flex: 1;
  padding: 13px 0 13px 22px;
  border: none;
  background: transparent;
  font-size: 1rem;
  color: var(--color-text);
  outline: none;
  min-width: 0;
}
.search-main-input::placeholder {
  color: var(--color-text-secondary);
  opacity: 0.6;
}
.search-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 4px 5px 4px 8px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--transition);
}
.search-submit svg {
  width: 18px;
  height: 18px;
}
.search-submit:hover {
  background: var(--color-accent);
}

/* Loading */
.loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
}
.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}
.empty-state p {
  font-size: 1rem;
  margin-bottom: 20px;
}
.add-first-btn {
  padding: 10px 24px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background var(--transition);
}
.add-first-btn:hover {
  background: var(--color-accent);
}

/* Sections */
.section {
  margin-bottom: 32px;
}
.section-title {
  font-family: var(--font-heading);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-secondary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-icon {
  width: 18px;
  height: 18px;
  color: var(--color-accent);
}
.title--glass {
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* Drag handle */
.section-drag-handle {
  width: 16px;
  height: 16px;
  cursor: grab;
  color: var(--color-text-secondary);
  opacity: 0.35;
  transition: opacity var(--transition);
  flex-shrink: 0;
}
.section-drag-handle:hover {
  opacity: 0.8;
}
.section-drag-handle:active {
  cursor: grabbing;
}

/* Link grid */
.link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

/* Drag states */
.drag-ghost {
  opacity: 0.4;
}
.section-drag-ghost {
  opacity: 0.4;
}

@media (max-width: 768px) {
  .header-inner {
    padding: 0 16px;
  }
  .username {
    display: none;
  }
  .content {
    padding: 20px 16px 40px;
  }
  .search-hero {
    margin-bottom: 28px;
  }
  .search-main-input {
    padding: 11px 0 11px 18px;
    font-size: 0.95rem;
  }
  .search-submit {
    width: 36px;
    height: 36px;
  }
  .link-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .section-drag-handle {
    opacity: 0.5;
  }
}
</style>
