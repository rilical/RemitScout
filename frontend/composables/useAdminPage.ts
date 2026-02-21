import { setSeo } from '~/composables/useSeo'

export const useAdminPage = (options: { title: string; description: string }) => {
  const route = useRoute()
  const {
    public: { siteUrl },
  } = useRuntimeConfig()

  setSeo({
    title: options.title,
    description: options.description,
    canonical: `${siteUrl}${route.path}`,
    noindex: true,
  })
}
