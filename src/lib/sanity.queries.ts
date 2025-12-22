import type { PortableTextBlock } from '@portabletext/types'
import type { ImageAsset, Slug } from '@sanity/types'
import groq from 'groq'
import { type SanityClient } from 'next-sanity'

// 🔍 Everything renamed from "project" → "post"

export const postsQuery = groq`*[_type == "post" && defined(slug.current)] | order(_createdAt desc) {
  _id,
  _createdAt,
  title,
  slug,
  date,
  mainImage,
  gallery[]{
    ...,
    caption
  },
  body,
  tags 
}`

export async function getPosts(client: SanityClient): Promise<Post[]> {
  return await client.fetch(postsQuery)
}

export const postBySlugQuery = groq`*[_type == "post" && slug.current == $slug][0]`

export async function getPost(
  client: SanityClient,
  slug: string,
): Promise<Post> {
  return await client.fetch(postBySlugQuery, {
    slug,
  })
}

export const postSlugsQuery = groq`
  *[_type == "post" && defined(slug.current)][].slug.current
`

// 🔠 Types

export interface Post {
  _type: 'post'
  _id: string
  _createdAt: string
  title?: string
  slug: Slug
  date: string
  mainImage?: ImageAsset
  body: PortableTextBlock[]
  tags?: string[]
  gallery?: {
    asset: {
      _ref: string
      _type: 'reference'
    }
    _key?: string
    _type: 'image'
    alt?: string
    caption?: string
  }[]
}

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0] {
  name,
  bioText,
  email,
  phone,
  socials
}`

export interface SiteSettings {
  name: string
  bioText?: string
  email?: string
  phone?: string
  socials?: {
    platform: 'instagram' | 'linkedin' | 'twitter' | 'vimeo' | 'website'
    url: string
    handle?: string
  }[]
}

export async function getSiteSettings(client: SanityClient): Promise<SiteSettings | null> {
  return await client.fetch(siteSettingsQuery)
}
