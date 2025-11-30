type Frontmatter = Record<string, any>

type Article = {
  slug: string
  title: string
  excerpt: string
  category: string
  categoryKey?: string
  readTime?: string
  author?: string
  date?: string
  lastUpdated?: string
  helpfulCount?: number
  tags?: string[]
  relatedArticles?: Array<{ slug: string, title: string, excerpt?: string }>
  faq?: Array<{ q: string, a: string }>
  content: string
}

const parseFrontmatter = (raw: string): { frontmatter: Frontmatter, body: string } => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)/m)
  if (!match) return { frontmatter: {}, body: raw }

  const [, fm, body] = match
  const frontmatter: Frontmatter = {}

  fm.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const [key, ...rest] = trimmed.split(':')
    if (!key || rest.length === 0) return
    const valueRaw = rest.join(':').trim()
    try {
      // allow JSON-like arrays/objects or plain strings
      const parsed = JSON.parse(valueRaw)
      frontmatter[key.trim()] = parsed
    }
    catch {
      frontmatter[key.trim()] = valueRaw.replace(/^['"]|['"]$/g, '')
    }
  })

  return { frontmatter, body: body || '' }
}

const simpleMarkdownToHtml = (md: string): string => {
  let html = md
    // escape angle brackets minimally
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // headings
  html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>')
    .replace(/^## (.*)$/gim, '<h2>$1</h2>')
    .replace(/^# (.*)$/gim, '<h1>$1</h1>')
  // bold/italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
  // unordered lists
  html = html.replace(/^\s*-\s+(.*)$/gim, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>')
  // paragraphs
  html = html.replace(/^(?!<h[1-3]|<ul|<li|<p|<blockquote|<pre)(.+)$/gim, '<p>$1</p>')

  return html.trim()
}

export const useArticles = () => {
  return useLazyAsyncData('articles', async () => {
    const files = import.meta.glob('~/content/learn/**/*.md', { as: 'raw', eager: true })
    const articles: Article[] = Object.entries(files).map(([path, raw]) => {
      const { frontmatter, body } = parseFrontmatter(String(raw))
      const content = simpleMarkdownToHtml(body)
      const slug = path.split('/content/learn/')[1]?.replace(/\.md$/, '') || path
      return {
        slug,
        title: frontmatter.title || slug,
        excerpt: frontmatter.excerpt || '',
        category: frontmatter.category || 'Money Transfer Basics',
        categoryKey: frontmatter.categoryKey || 'money-transfer-basics',
        readTime: frontmatter.readTime || '',
        author: frontmatter.author || 'Remit-Scout Team',
        date: frontmatter.date || '',
        lastUpdated: frontmatter.lastUpdated || frontmatter.date || '',
        helpfulCount: frontmatter.helpfulCount || 0,
        tags: frontmatter.tags || [],
        relatedArticles: frontmatter.relatedArticles || [],
        faq: frontmatter.faq || [],
        content,
      }
    })

    return articles.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  })
}

export const useArticle = (slug: string) => {
  return useLazyAsyncData(`article-${slug}`, async () => {
    const articles = (await useArticles().data.value) || []
    return articles.find(a => a.slug === slug) || null
  })
}
