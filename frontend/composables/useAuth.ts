export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  isPlus: boolean
}

export const useAuth = () => {
  const user = ref<User | null>(null)
  const watchlistCount = ref(0)
  const alertsCount = ref(0)

  const isAuthenticated = computed(() => user.value !== null)
  const isPlus = computed(() => user.value?.isPlus ?? false)

  function setUser(newUser: User | null) {
    user.value = newUser
    if (newUser) {
      watchlistCount.value = 5
      alertsCount.value = 3
    } else {
      watchlistCount.value = 0
      alertsCount.value = 0
    }
  }

  function setWatchlistCount(count: number) {
    watchlistCount.value = count
  }

  function setAlertsCount(count: number) {
    alertsCount.value = count
  }

  function signIn(email: string, password: string) {
    setUser({
      id: '1',
      email,
      name: email.split('@')[0],
      isPlus: false,
    })
  }

  function signOut() {
    setUser(null)
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isPlus,
    watchlistCount: readonly(watchlistCount),
    alertsCount: readonly(alertsCount),
    setUser,
    setWatchlistCount,
    setAlertsCount,
    signIn,
    signOut,
  }
}
