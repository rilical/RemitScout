export interface Author {
  id: string
  name: string
  role: string
  photo: string
  bio: string
  credentials: string[]
  expertise: string[]
  yearsExperience: number
  linkedIn?: string
}

export const authors: Record<string, Author> = {
  'ana-reyes': {
    id: 'ana-reyes',
    name: 'Ana Reyes',
    role: 'Remittance Analyst',
    photo: '/images/authors/ana-reyes.jpg',
    bio: 'Ana specializes in analyzing remittance corridors across Southeast Asia, with deep expertise in Philippines and Vietnam markets.',
    credentials: [
      'Certified Financial Analyst (CFA)',
      'MA Economics, University of the Philippines'
    ],
    expertise: ['Philippines', 'Vietnam', 'Indonesia', 'Exchange Rates', 'Banking Regulations'],
    yearsExperience: 7,
    linkedIn: 'https://linkedin.com/in/ana-reyes'
  },
  'tom-okafor': {
    id: 'tom-okafor',
    name: 'Tom Okafor',
    role: 'Data Editor',
    photo: '/images/authors/tom-okafor.jpg',
    bio: 'Tom leads our data analysis team, ensuring accuracy in provider comparisons and fee structures across 150+ countries.',
    credentials: [
      'MSc Data Science, London School of Economics',
      'BSc Computer Science, University of Lagos'
    ],
    expertise: ['Data Analysis', 'Provider Comparisons', 'API Integration', 'Fee Structures'],
    yearsExperience: 5,
    linkedIn: 'https://linkedin.com/in/tom-okafor'
  },
  'nadia-khan': {
    id: 'nadia-khan',
    name: 'Nadia Khan',
    role: 'FX Researcher',
    photo: '/images/authors/nadia-khan.jpg',
    bio: 'Nadia researches foreign exchange markets and helps expatriates understand hidden fees in international transfers.',
    credentials: [
      'PhD Finance, Harvard Business School',
      'Former FX Trader at JP Morgan'
    ],
    expertise: ['Foreign Exchange', 'Market Analysis', 'Hidden Fees', 'Exchange Margins'],
    yearsExperience: 10,
    linkedIn: 'https://linkedin.com/in/nadia-khan'
  },
  'luis-martinez': {
    id: 'luis-martinez',
    name: 'Luis Martínez',
    role: 'Regional Specialist',
    photo: '/images/authors/luis-martinez.jpg',
    bio: 'Luis covers Latin American remittance corridors with focus on Mexico, Colombia, and Brazil markets.',
    credentials: [
      'MBA International Business, INSEAD',
      'Former Compliance Officer at Western Union'
    ],
    expertise: ['Latin America', 'Compliance', 'Cash Pickup Networks', 'Mobile Wallets'],
    yearsExperience: 8,
    linkedIn: 'https://linkedin.com/in/luis-martinez'
  },
  'sarah-chen': {
    id: 'sarah-chen',
    name: 'Sarah Chen',
    role: 'Telecom Researcher',
    photo: '/images/authors/sarah-chen.jpg',
    bio: 'Sarah researches international telecom services, eSIM technology, and roaming alternatives for travelers.',
    credentials: [
      'MSc Telecommunications, Stanford University',
      'Former Product Manager at T-Mobile'
    ],
    expertise: ['eSIM Technology', 'Mobile Networks', 'Roaming', 'Travel Connectivity'],
    yearsExperience: 6,
    linkedIn: 'https://linkedin.com/in/sarah-chen'
  }
}

export const getAuthor = (id: string): Author | undefined => {
  return authors[id]
}

export const getAuthorsByExpertise = (expertise: string): Author[] => {
  return Object.values(authors).filter(author => 
    author.expertise.includes(expertise)
  )
}

export const getRandomAuthor = (): Author => {
  const authorIds = Object.keys(authors)
  const randomId = authorIds[Math.floor(Math.random() * authorIds.length)]
  return authors[randomId]
}












