import { computed } from 'vue'
import { fetchPopularCorridors } from '~/domains/transfers/infrastructure/popularCorridorsApi'
import { getCorridorUrl } from '~/utils/country-slugs'
import { getCountryByCode } from '~/utils/countries-currencies'

export type PopularCorridorCard = {
  id: string
  from: string
  to: string
  href: string
  fromFlag: string
  toFlag: string
  topProvider: string | undefined
  count24h: number | undefined
}

export type PopularCorridorGroup = {
  fromCountry: string
  corridors: PopularCorridorCard[]
}

function flagFor(code: string) {
  const country = getCountryByCode(code)
  return country?.flag || '🏳️'
}

export function groupPopularCorridors(items: Array<{ route?: string, top_provider?: string, count_24h?: number }> | undefined) {
  if (!items?.length) return []

  const corridors = items
    .map((item) => {
      const route = item.route || ''
      const [from, to] = route.split(' → ').map(s => s.trim())
      if (!from || !to) return null

      return {
        id: `${from}-${to}`,
        from,
        to,
        href: getCorridorUrl(from, to),
        fromFlag: flagFor(from),
        toFlag: flagFor(to),
        topProvider: item.top_provider,
        count24h: item.count_24h,
      } satisfies PopularCorridorCard
    })
    .filter((corridor): corridor is PopularCorridorCard => corridor !== null)

  const grouped = corridors.reduce((acc, corridor) => {
    acc[corridor.from] ||= []
    acc[corridor.from].push(corridor)
    return acc
  }, {} as Record<string, PopularCorridorCard[]>)

  return Object.entries(grouped).map(([fromCountry, corridors]) => ({
    fromCountry,
    corridors,
  }))
}

export function usePopularCorridorsModel() {
  const { data, pending, error } = useAsyncData(
    'popular-corridors',
    async () => {
      try {
        return await fetchPopularCorridors()
      }
      catch (err: any) {
        if (err?.statusCode === 401 || err?.statusCode === 403 || err?.statusCode === 500) {
          return { data: [], updatedAt: new Date().toISOString() }
        }
        throw err
      }
    },
    { watch: [] },
  )

  const corridorsByCountry = computed<PopularCorridorGroup[]>(() => (
    groupPopularCorridors(data.value?.data)
  ))

  return {
    data,
    pending,
    error,
    corridorsByCountry,
  }
}
