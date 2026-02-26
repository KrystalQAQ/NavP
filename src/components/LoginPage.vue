<script setup>
import { ref } from 'vue'
import { login } from '../api.js'

const emit = defineEmits(['login'])

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)
const shakeError = ref(false)

async function handleSubmit() {
  error.value = ''
  shakeError.value = false
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码'
    triggerShake()
    return
  }
  submitting.value = true
  try {
    const data = await login(username.value, password.value)
    emit('login', data)
  } catch (e) {
    error.value = e.message || '登录失败'
    triggerShake()
  } finally {
    submitting.value = false
  }
}

function triggerShake() {
  shakeError.value = true
  setTimeout(() => { shakeError.value = false }, 500)
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="accent-bar"></div>
      <div class="login-header">
        <h1 class="login-logo">NavP</h1>
        <p class="login-subtitle">网站导航</p>
      </div>
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="username">用户名</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              :disabled="submitting"
            />
          </div>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              :disabled="submitting"
            />
          </div>
        </div>
        <div v-if="error" class="error-msg" :class="{ shake: shakeError }">{{ error }}</div>
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
  background: #0F0F12;
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 40%, rgba(212, 175, 55, 0.08) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 60%, rgba(30, 30, 50, 0.6) 0%, transparent 70%),
    linear-gradient(160deg, #0F0F12 0%, #1A1A2E 50%, #16161D 100%);
}
.login-card {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 48px 40px;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-accent), #C5A028, var(--color-accent));
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}
.login-header {
  text-align: center;
  margin-bottom: 36px;
}
.login-logo {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.02em;
}
.login-subtitle {
  color: rgba(255, 255, 255, 0.5);
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
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  transition: color var(--transition);
}
.input-wrapper:focus-within .input-icon {
  color: var(--color-accent);
}
.form-group input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
  outline: none;
}
.form-group input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
.form-group input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
  background: rgba(255, 255, 255, 0.08);
}
.form-group input:disabled {
  opacity: 0.6;
}
.error-msg {
  color: #FCA5A5;
  font-size: 0.85rem;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.12);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.error-msg.shake {
  animation: shake 0.4s ease;
}
.login-btn {
  width: 100%;
  padding: 13px;
  background: var(--color-accent);
  color: #0F0F12;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-slow), box-shadow var(--transition-slow), transform var(--transition-fast);
}
.login-btn:hover:not(:disabled) {
  background: var(--color-accent-hover);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.25);
  transform: translateY(-1px);
}
.login-btn:active:not(:disabled) {
  transform: translateY(0);
}
.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .login-card {
    padding: 36px 24px;
  }
}
</style>
