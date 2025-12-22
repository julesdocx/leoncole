import type { GetStaticProps } from 'next'
import { useLiveQuery } from 'next-sanity/preview'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'motion/react'

import Card from '~/components/Card'
import Header from '~/components/Header'
import Container from '~/components/Container'
import { readToken } from '~/lib/sanity.api'
import { getClient } from '~/lib/sanity.client'
import { getPosts, getSiteSettings, type Post, type SiteSettings, postsQuery } from '~/lib/sanity.queries'
import type { SharedPageProps } from '~/pages/_app'

export const getStaticProps: GetStaticProps<
  SharedPageProps & {
    posts: Post[]
    settings: SiteSettings | null
  }
> = async ({ draftMode = false }) => {
  const client = getClient(draftMode ? { token: readToken } : undefined)
  const posts = await getPosts(client)
  const settings = await getSiteSettings(client)

  return {
    props: {
      draftMode,
      token: draftMode ? readToken : '',
      posts,
      settings,
    },
  }
}

export default function IndexPage({
  posts: initialPosts,
  settings,
}: {
  posts: Post[]
  settings: SiteSettings | null
}) {
  const router = useRouter()
  const [posts] = useLiveQuery<Post[]>(initialPosts, postsQuery)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 750)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const urlTags = router.query.tags
    if (typeof urlTags === 'string') {
      const tagsFromUrl = urlTags.split(',').filter(Boolean)
      setActiveTags(tagsFromUrl)
    }

    // Handle selected post from URL
    const postId = router.query.post
    if (typeof postId === 'string') {
      const post = posts.find((p) => p._id === postId)
      if (post) setSelectedPost(post)
    }
  }, [router.query.tags, router.query.post, posts])

  const updateUrlTags = (tags: string[]) => {
    const query = { ...router.query }
    if (tags.length > 0) {
      query.tags = tags.join(',')
    } else {
      delete query.tags
    }

    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    )
  }

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
      updateUrlTags(next)
      return next
    })
  }

  const selectPost = (post: Post) => {
    // Toggle: if clicking on already selected post, deselect it
    if (selectedPost && selectedPost._id === post._id) {
      closeDetail()
      return
    }

    setSelectedPost(post)
    const query = { ...router.query, post: post._id }
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    )
  }

  const closeDetail = () => {
    setSelectedPost(null)
    const query = { ...router.query }
    delete query.post
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    )
  }

  const filteredPosts =
    activeTags.length === 0
      ? posts
      : posts.filter((post) =>
          post.tags?.some((tag) => activeTags.includes(tag))
        )

  const sortedPosts = filteredPosts
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .reverse()

  return (
    <Container>
      <Header settings={settings} />
      
      <main>
        <AnimatePresence>
          {/* Centered card column */}
          <div className="flex flex-col items-center gap-6">
            {sortedPosts.length ? (
              sortedPosts
                .slice()
                .reverse()
                .map((post) => {
                  const isSelected = selectedPost && selectedPost._id === post._id

                  return (
                    <div
                      key={post._id}
                      onClick={() => selectPost(post)}
                      className="cursor-pointer w-full  sm:w-[500px]"
                    >
                      <Card 
                        post={post} 
                        isSelected={isSelected}
                        isMobile={isMobile}
                      />
                    </div>
                  )
                })
            ) : (
              <motion.div
                key="no-posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-gray-500"
              >
                No posts match the selected tags.
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </main>
    </Container>
  )
}