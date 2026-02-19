const API_BASE = '/api'

function getHeaders(token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
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

export async function execSQL(token, sql, params = []) {
  const res = await fetch(`${API_BASE}/sql`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ sql, params }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || '查询失败')
  return data
}

export async function ensureNavUser(token, username) {
  const result = await execSQL(
    token,
    'SELECT id FROM nav_users WHERE username = ? LIMIT 1',
    [username]
  )
  if (result.data && result.data.length > 0) {
    return result.data[0].id
  }
  await execSQL(
    token,
    "INSERT INTO nav_users (username, password_hash, role, status) VALUES (?, '__gateway__', 'user', 'active')",
    [username]
  )
  const result2 = await execSQL(
    token,
    'SELECT id FROM nav_users WHERE username = ? LIMIT 1',
    [username]
  )
  return result2.data[0].id
}

export async function getLinks(token, userId) {
  return execSQL(
    token,
    'SELECT * FROM nav_links WHERE user_id = ? ORDER BY sort_order, title LIMIT 500',
    [userId]
  )
}

export async function getCategoryOrder(token, userId) {
  return execSQL(
    token,
    'SELECT category, sort_order FROM nav_category_sort WHERE user_id = ? ORDER BY sort_order LIMIT 200',
    [userId]
  )
}

export async function saveCategoryOrder(token, userId, categories) {
  await execSQL(token, 'DELETE FROM nav_category_sort WHERE user_id = ?', [userId])
  if (categories.length === 0) return
  const placeholders = categories.map(() => '(?, ?, ?)').join(', ')
  const params = categories.flatMap((cat, i) => [userId, cat, i])
  await execSQL(
    token,
    `INSERT INTO nav_category_sort (user_id, category, sort_order) VALUES ${placeholders}`,
    params
  )
}

export async function saveLinkOrder(token, linkIds) {
  if (linkIds.length === 0) return
  await Promise.all(
    linkIds.map((id, i) =>
      execSQL(token, 'UPDATE nav_links SET sort_order = ? WHERE id = ?', [i, id])
    )
  )
}

export async function addLink(token, userId, { title, url, category, note }) {
  return execSQL(
    token,
    'INSERT INTO nav_links (user_id, title, url, category, note) VALUES (?, ?, ?, ?, ?)',
    [userId, title, url, category || '未分类', note || '']
  )
}

export async function updateLink(token, id, { title, url, category, note, pinned }) {
  return execSQL(
    token,
    'UPDATE nav_links SET title = ?, url = ?, category = ?, note = ?, pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, url, category || '未分类', note || '', pinned ? 1 : 0, id]
  )
}

export async function deleteLink(token, id) {
  return execSQL(token, 'DELETE FROM nav_links WHERE id = ?', [id])
}

export async function togglePin(token, id, pinned) {
  return execSQL(
    token,
    'UPDATE nav_links SET pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [pinned ? 1 : 0, id]
  )
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
  return execSQL(
    token,
    'SELECT setting_key, setting_value FROM nav_settings WHERE user_id = ? LIMIT 50',
    [userId]
  )
}

export async function saveSettings(token, userId, settings) {
  await Promise.all(
    Object.entries(settings).map(([key, value]) =>
      execSQL(
        token,
        'INSERT INTO nav_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [userId, key, String(value)]
      )
    )
  )
}
