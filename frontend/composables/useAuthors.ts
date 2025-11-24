import { authors, getAuthor, getAuthorsByExpertise, type Author } from '~/utils/authors'

export const useAuthors = () => {
  const getAuthorById = (id: string): Author | undefined => {
    return getAuthor(id)
  }

  const getAuthorByExpertise = (expertise: string): Author[] => {
    return getAuthorsByExpertise(expertise)
  }

  const getAuthorForCorridor = (from: string, to: string): Author => {
    // Map corridors to regional expertise
    const corridorExpertise: Record<string, string> = {
      PH: 'Philippines',
      IN: 'India',
      VN: 'Vietnam',
      ID: 'Indonesia',
      MX: 'Mexico',
      CO: 'Colombia',
      BR: 'Brazil',
      NG: 'Nigeria',
      PK: 'Pakistan',
      BD: 'Bangladesh',
    }

    const expertise = corridorExpertise[to] || 'Exchange Rates'
    const experts = getAuthorsByExpertise(expertise)

    if (experts.length > 0) {
      return experts[0]
    }

    // Fallback to a general expert
    return authors['tom-okafor']
  }

  const getAuthorForTopic = (topic: 'remittance' | 'esim' | 'fx' | 'data'): Author => {
    const topicAuthorMap: Record<string, string> = {
      remittance: 'ana-reyes',
      esim: 'sarah-chen',
      fx: 'nadia-khan',
      data: 'tom-okafor',
    }

    return authors[topicAuthorMap[topic]] || authors['tom-okafor']
  }

  const formatAuthorCredentials = (author: Author): string => {
    return author.credentials.join(' • ')
  }

  const getAuthorImageUrl = (author: Author): string => {
    // Placeholder image for now - in production, these would be real images
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=6366f1&color=fff&size=128`
  }

  return {
    authors,
    getAuthorById,
    getAuthorByExpertise,
    getAuthorForCorridor,
    getAuthorForTopic,
    formatAuthorCredentials,
    getAuthorImageUrl,
  }
}

