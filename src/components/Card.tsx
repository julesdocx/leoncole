import { useState, useEffect } from 'react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { urlForImage } from '~/lib/sanity.image'
import type { Post } from '~/lib/sanity.queries'
import { motion, AnimatePresence } from 'motion/react'

export default function Card({ 
  post, 
  expandAll = false,
  onClick,
  onImageClick,
  isSelected = false,
  loadingDelay = 0,
  isMobile = false,
  selectedImageIndex = 0,
  onImageSelect,
  allImages = []
}: { 
  post: Post
  expandAll?: boolean
  onClick?: () => void
  onImageClick?: (index: number) => void
  isSelected?: boolean
  loadingDelay?: number
  isMobile?: boolean
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
  allImages?: Array<{ image: any; isMain: boolean }>
}) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!post.gallery || isSelected) return

    // Load images progressively with delay
    post.gallery.forEach((image, index) => {
      if (!image || !image.asset) return
      
      const delay = (loadingDelay * 300) + (index * 100) // 300ms per card, 100ms per image
      
      setTimeout(() => {
        setLoadedImages(prev => new Set(prev).add(index))
      }, delay)
    })
  }, [post.gallery, isSelected, loadingDelay])

  return (
    <div className="card" onClick={onClick}>
      <p 
        className='card__header'
        style={{
          fontWeight: isSelected ? 'bold' : 'normal',
          fontSize: isSelected ? '16px' : '12px',
          transition: 'font-size 0.2s, font-weight 0.2s'
        }}
      >
        {post.title}
      </p>
      <p className="card__date">
        {new Date(post.date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </p>
      
      {post.tags && post.tags.length > 0 && (
        <div className="card__tags">
          {post.tags.map((tag) => (
            <span key={tag} className="card__tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {isSelected ? (
        <>
          {/* Show body text when selected */}
          {post.body && (
            <div className="card__content">
              <PortableText value={post.body} />
            </div>
          )}

          {/* Show gallery in card on mobile - EXACT COPY of mainDiv functionality */}
          {isMobile && allImages.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              {/* Large display of selected image */}
              {(() => {
                const selectedImageData = allImages[selectedImageIndex]
                
                if (!selectedImageData) return null
                
                const imageUrl = urlForImage(selectedImageData.image)?.url()
                if (!imageUrl) return null
                
                return (
                  <div className="image-container" style={{ marginBottom: '1rem' }}>
                    <Image
                      src={imageUrl}
                      alt={selectedImageData.isMain ? post.title : `Gallery image`}
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
                {allImages.map((imageData, i) => {
                  const imageUrl = urlForImage(imageData.image)?.url()
                  if (!imageUrl) return null
                  
                  const isCurrentlySelected = i === selectedImageIndex
                  
                  return (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation()
                        onImageSelect?.(i)
                      }}
                      style={{
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s',
                        boxShadow: isCurrentlySelected ? '0 4px 8px rgba(0, 0, 0, 0.3)' : 'none'
                      }}
                    >
                      <Image
                        src={imageUrl}
                        alt={imageData.isMain ? post.title : `Thumbnail ${i}`}
                        width={100}
                        height={100}
                        quality={50}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          aspectRatio: '1/1',
                          display: 'block'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        // Show gallery thumbnails when not selected
        post.gallery && post.gallery.length > 0 && (
          <div className="card__gallery--thumbs">
            {post.gallery
              .filter((image) => image && image.asset)
              .map((image, i) => {
                const imageUrl = urlForImage(image)?.url()
                const shouldLoad = loadedImages.has(i)
                
                if (!imageUrl) return null
                
                return (
                  <div 
                    key={image._key || i}
                    style={{
                      backgroundColor: '#f0f0f0',
                      aspectRatio: '1/1',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {shouldLoad && (
                      <Image
                        src={imageUrl}
                        alt={image.alt || `Gallery image ${i + 1}`}
                        width={100}
                        height={100}
                        quality={10}
                        loading="lazy"
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          aspectRatio: '1/1',
                          display: 'block'
                        }}
                      />
                    )}
                  </div>
                )
              })}
          </div>
        )
      )}
    </div>
  )
}