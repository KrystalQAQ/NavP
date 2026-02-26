<script setup>
import { ref, onMounted, provide } from 'vue'
import { getMe } from './api.js'
import LoginPage from './components/LoginPage.vue'
import NavPage from './components/NavPage.vue'

const token = ref(localStorage.getItem('nav_token') || '')
const user = ref(null)
const loading = ref(true)
const loadingFadeOut = ref(false)

provide('token', token)
provide('user', user)

async function checkAuth() {
  if (!token.value) {
    loading.value = false
    return
  }
  try {
    const res = await getMe(token.value)
    user.value = res.user
  } catch {
    token.value = ''
    localStorage.removeItem('nav_token')
  }
  loadingFadeOut.value = true
  setTimeout(() => {
    loading.value = false
    loadingFadeOut.value = false
  }, 300)
}

function onLogin(data) {
  token.value = data.token
  user.value = data.user
  localStorage.setItem('nav_token', data.token)
}

function onLogout() {
  token.value = ''
  user.value = null
  localStorage.removeItem('nav_token')
  localStorage.removeItem('nav_user_id')
}

onMounted(checkAuth)
</script>

<template>
  <div v-if="loading" class="loading-screen" :class="{ 'fade-out': loadingFadeOut }">
    <div class="spinner"></div>
  </div>
  <Transition name="page" mode="out-in" v-else>
    <LoginPage v-if="!user" key="login" @login="onLogin" />
    <NavPage v-else key="nav" @logout="onLogout" />
  </Transition>
</template>

<style scoped>
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  transition: opacity 0.3s ease;
}
.loading-screen.fade-out {
  opacity: 0;
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

/* Page transition */
.page-enter-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
