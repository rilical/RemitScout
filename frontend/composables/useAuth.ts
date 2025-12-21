import { createId } from '~/utils/id'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export const useAuth = () => {
  const { state: user, hydrated } = usePersistedState<User | null>('auth:user', () => null)

  const isLoggedIn = computed(() => user.value !== null)

  function setUser(newUser: User | null) {
    user.value = newUser
  }

  function signIn(email: string, _password?: string) {
    setUser({
      id: createId('user'),
      email,
      name: email.split('@')[0] || 'User',
    })
  }

  function signOut() {
    setUser(null)
  }

  function updateProfile(updates: Partial<Pick<User, 'name' | 'avatar'>>) {
    if (user.value) {
      user.value = { ...user.value, ...updates }
    }
  }

  function updateAvatar(avatarUrl: string | undefined) {
    updateProfile({ avatar: avatarUrl })
  }

  return {
    user,
    hydrated,
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    signIn,
    signOut,
    setUser,
    updateProfile,
    updateAvatar,
  }
}



