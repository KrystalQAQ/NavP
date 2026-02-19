<script setup>
import { ref } from 'vue'
import { login } from '../api.js'

const emit = defineEmits(['login'])

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }
  submitting.value = true
  try {
    const data = await login(username.value, password.value)
    emit('login', data)
  } catch (e) {
    error.value = e.message || '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-logo">NavP</h1>
        <p class="login-subtitle">网站导航</p>
      </div>
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="请输入用户名"
            :disabled="submitting"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            :disabled="submitting"
          />
        </div>
        <div v-if="error" class="error-msg">{{ error }}</div>
        <button type="submit" class="login-btn" :disabled="submitting">
          {{ submitting ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--color-bg);
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 48px 40px;
}
.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}
.login-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-top: 4px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-secondary);
  margin-bottom: 6px;
}
.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color var(--transition);
  outline: none;
}
.form-group input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}
.form-group input:disabled {
  opacity: 0.6;
}
.error-msg {
  color: var(--color-error);
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.login-btn {
  width: 100%;
  padding: 12px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition);
}
.login-btn:hover:not(:disabled) {
  background: var(--color-secondary);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
