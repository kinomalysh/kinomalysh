export interface BookPage {
  text: string
  image: string | Buffer
}

export interface BookSpec {
  title: string
  childName: string
  coverImage?: string | Buffer
  pages: BookPage[]
  withCover?: boolean
}
