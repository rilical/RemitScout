type BackendUser = {
  user_id: string
  email: string
  name: string | null
  avatar_url: string | null
}

type MeResponse = {
  success: boolean
  user: BackendUser
}

export const useMe = () => {
  const { request } = useApi()
  const { user, applyBackendProfile } = useAuth()

  const getMe = async () => {
    const data = await request<MeResponse>('/me')
    if (data?.user) {
      applyBackendProfile(data.user)
    }
    return data
  }

  const updateProfile = async (payload: { name?: string | null; avatar_url?: string | null }) => {
    const data = await request<MeResponse>('/me', {
      method: 'PATCH',
      body: payload,
    })
    if (data?.user) {
      applyBackendProfile(data.user)
    }
    return data
  }

  const uploadAvatar = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    const data = await request<{ success: boolean; avatar_url: string | null }>(
      '/me/avatar',
      {
        method: 'POST',
        body: formData,
      },
    )

    if (user.value) {
      user.value = {
        ...user.value,
        avatar: data.avatar_url ?? undefined,
      }
    }

    return data
  }

  const removeAvatar = async () => {
    const data = await request<{ success: boolean }>('/me/avatar', {
      method: 'DELETE',
    })

    if (user.value) {
      user.value = {
        ...user.value,
        avatar: undefined,
      }
    }

    return data
  }

  return {
    getMe,
    updateProfile,
    uploadAvatar,
    removeAvatar,
  }
}
