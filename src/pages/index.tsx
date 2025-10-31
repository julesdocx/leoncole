import type { GetStaticProps } from 'next'
import { useLiveQuery } from 'next-sanity/preview'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'

import Card from '~/components/Card'
import Container from '~/components/Container'
import { readToken } from '~/lib/sanity.api'
import { getClient } from '~/lib/sanity.client'
import { getPosts, type Post, postsQuery } from '~/lib/sanity.queries'
import { urlForImage } from '~/lib/sanity.image'
import type { SharedPageProps } from '~/pages/_app'

export const getStaticProps: GetStaticProps<
  SharedPageProps & {
    posts: Post[]
    tags: string[]
  }
> = async ({ draftMode = false }) => {
  const client = getClient(draftMode ? { token: readToken } : undefined)
  const posts = await getPosts(client)

  const tagSet = new Set<string>()
  posts.forEach((post) => {
    post.tags?.forEach((tag) => tagSet.add(tag))
  })
  const tags = Array.from(tagSet)

  return {
    props: {
      draftMode,
      token: draftMode ? readToken : '',
      posts,
      tags,
    },
  }
}

export default function IndexPage({
  posts: initialPosts,
}: {
  posts: Post[]
}) {
  const router = useRouter()
  const [posts] = useLiveQuery<Post[]>(initialPosts, postsQuery)
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0)
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null)
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

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])))

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

  const toggleHeader = () => {
    setIsHeaderExpanded(!isHeaderExpanded)
  }

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
    setSelectedImageIndex(0) // Reset to first image (mainImage)
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
    setSelectedImageIndex(0)
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

  // Create combined array of all images (mainImage + gallery)
  const getAllImages = (post: Post) => {
    const images = []
    
    // Add mainImage as first item if it exists
    if (post.mainImage && post.mainImage.asset) {
      images.push({ image: post.mainImage, isMain: true })
    }
    
    // Add gallery images
    if (post.gallery && post.gallery.length > 0) {
      post.gallery
        .filter((image) => image && image.asset)
        .forEach((image) => {
          images.push({ image, isMain: false })
        })
    }
    
    return images
  }

  return (
    <Container>
      <div className="header__container">
        <header className={`header ${!isHeaderExpanded ? 'header-collapsed' : ''}`}>

          <AnimatePresence>
            <div className="posts__container">
              {sortedPosts.length ? (
                sortedPosts
                  .slice()
                  .reverse()
                  .map((post, cardIndex) => {
                    const isSelected = selectedPost && selectedPost._id === post._id
                    const isHovered = hoveredPostId === post._id
                    const hasSelection = selectedPost !== null
                    const hasHover = hoveredPostId !== null
                    
                    // If selected, use selection opacity logic
                    // Otherwise, use hover opacity logic (only on desktop)
                    let opacity = 1
                    if (hasSelection) {
                      opacity = isSelected ? 1 : 0.2
                    } else if (hasHover && !isMobile) {
                      opacity = isHovered ? 1 : 0.2
                    }

                    return (
                      <motion.div
                        key={post._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: opacity, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ 
                          duration: 0.3,
                        }}
                        onClick={() => selectPost(post)}
                        onMouseEnter={() => !isMobile && setHoveredPostId(post._id)}
                        onMouseLeave={() => !isMobile && setHoveredPostId(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Card 
                          post={post} 
                          expandAll={false}
                          isSelected={isSelected}
                          isMobile={isMobile}
                          selectedImageIndex={selectedImageIndex}
                          onImageSelect={(index) => setSelectedImageIndex(index)}
                          allImages={getAllImages(post)}
                        />
                      </motion.div>
                    )
                  })
              ) : (
                <motion.div
                  key="no-posts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No posts match the selected tags.
                </motion.div>
              )}
            </div>
          </AnimatePresence>
        </header>
        
        <div id="mainDiv">
          <AnimatePresence>
            {selectedPost && !isMobile && (
              <motion.section
                className="detail-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="detail-view__content">
                  <AnimatePresence>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        duration: 0.4, 
                        ease: "easeInOut",
                        opacity: { duration: 0.3 }
                      }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginTop: '10px' }}>
                        {/* Large display of selected image */}
                        {(() => {
                          const allImages = getAllImages(selectedPost)
                          const selectedImageData = allImages[selectedImageIndex]
                          
                          if (!selectedImageData) return null
                          
                          const imageUrl = urlForImage(selectedImageData.image)?.url()
                          if (!imageUrl) return null
                          
                          return (
                            <div className="image-container" style={{ marginBottom: '1rem' }}>
                              <Image
                                src={imageUrl}
                                alt={selectedImageData.isMain ? selectedPost.title : `Gallery image`}
                                width={0}
                                height={0}
                                sizes="100vw"
                                style={{
                                  width: '100%',  
                                  height: 'auto',
                                  maxHeight: '400px',
                                  objectFit: 'contain'
                                }}
                              />
                            </div>
                          )
                        })()}

                        {/* Thumbnail grid */}
                        <div className="card__gallery--thumbs">
                          {getAllImages(selectedPost).map((imageData, i) => {
                            const imageUrl = urlForImage(imageData.image)?.url()
                            if (!imageUrl) return null
                            
                            const isCurrentlySelected = i === selectedImageIndex
                            
                            return (
                              <div
                                key={i}
                                onClick={() => setSelectedImageIndex(i)}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'box-shadow 0.2s',
                                  boxShadow: isCurrentlySelected ? '0 4px 8px rgba(0, 0, 0, 0.3)' : 'none'
                                }}
                              >
                                <Image
                                  src={imageUrl}
                                  alt={imageData.isMain ? selectedPost.title : `Thumbnail ${i}`}
                                  width={100}
                                  height={100}
                                  quality={50}
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    aspectRatio: '1/1'
                                  }}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Container>
  )
}