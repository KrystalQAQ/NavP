const API_BASE = '/api'

function getHeaders(token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function callApi(token, apiKey, params = {}) {
  const res = await fetch(`${API_BASE}/${apiKey}`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ params }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '登录失败')
  return data
}

export async function getMe(token) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '未认证')
  return data
}

export async function ensureNavUser(token, username) {
  const result = await callApi(token, 'get-nav-user', { username })
  if (result.data && result.data.length > 0) {
    return result.data[0].id
  }
  await callApi(token, 'create-nav-user', { username })
  const result2 = await callApi(token, 'get-nav-user', { username })
  return result2.data[0].id
}

export async function getLinks(token, userId) {
  return callApi(token, 'get-links', { userId })
}

export async function getCategoryOrder(token, userId) {
  return callApi(token, 'get-category-order', { userId })
}

export async function saveCategoryOrder(token, userId, categories) {
  await callApi(token, 'delete-category-order', { userId })
  if (categories.length === 0) return
  await Promise.all(
    categories.map((category, i) =>
      callApi(token, 'add-category-order', { userId, category, sortOrder: i })
    )
  )
}

export async function saveLinkOrder(token, linkIds) {
  if (linkIds.length === 0) return
  await Promise.all(
    linkIds.map((id, i) =>
      callApi(token, 'update-link-order', { sortOrder: i, id })
    )
  )
}

export async function addLink(token, userId, { title, url, category, note }) {
  return callApi(token, 'add-link', {
    userId,
    title,
    url,
    category: category || '未分类',
    note: note || '',
  })
}

export async function updateLink(token, id, { title, url, category, note, pinned }) {
  return callApi(token, 'update-link', {
    title,
    url,
    category: category || '未分类',
    note: note || '',
    pinned: pinned ? 1 : 0,
    id,
  })
}

export async function deleteLink(token, id) {
  return callApi(token, 'delete-link', { id })
}

export async function togglePin(token, id, pinned) {
  return callApi(token, 'toggle-pin', { pinned: pinned ? 1 : 0, id })
}

// --- Upload ---

export async function uploadFile(token, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '上传失败')
  return data
}

// --- Settings ---

export async function getSettings(token, userId) {
  return callApi(token, 'get-settings', { userId })
}

export async function saveSettings(token, userId, settings) {
  await Promise.all(
    Object.entries(settings).map(([settingKey, settingValue]) =>
      callApi(token, 'save-setting', { userId, settingKey, settingValue: String(settingValue) })
    )
  )
}
