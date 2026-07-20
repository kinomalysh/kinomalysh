export interface BlogSection {
  heading: string
  body: string
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  h1: string
  excerpt: string
  published: string
  readingMinutes: number
  sections: BlogSection[]
  related: string[]
}
