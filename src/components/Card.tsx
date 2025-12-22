import { useState } from 'react'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { AnimatePresence } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { urlForImage } from '~/lib/sanity.image'
import type { Post } from '~/lib/sanity.queries'
import Lightbox from '~/components/LightBox'

type SanityImage = {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  _key?: string
  alt?: string
  caption?: string
}

export default function Card({ 
  post, 
  onClick,
  isSelected = false,
  isMobile = false,
}: { 
  post: Post
  onClick?: () => void
  isSelected?: boolean
  isMobile?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  
  const mainImageUrl = post.mainImage?.asset ? urlForImage(post.mainImage)?.url() : null
  const galleryImages = post.gallery?.filter(img => img?.asset) || []
  const previewImages = galleryImages.slice(0, 4)
  
  // All images for lightbox (mainImage + gallery)
  const allImages = [
    ...(post.mainImage?.asset ? [post.mainImage] : []),
    ...galleryImages
  ]

  const openLightbox = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLightboxIndex(index)
  }

  const lightboxImages: SanityImage[] = allImages.filter(
  (img): img is SanityImage =>
    typeof img === 'object' &&
    '_type' in img &&
    img._type === 'image' &&
    'asset' in img
)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="p-2"
    >
      {/* Card row */}
      <div className="flex gap-4 ">
        {/* Stacked images */}
        {mainImageUrl && (
          <div className="w-56 flex-shrink-0 relative">
            {/* Background stacked images */}
            {previewImages.map((img, i) => {
              const url = urlForImage(img)?.url()
              if (!url) return null
              const offset = isHovered || isSelected ? 0 : (previewImages.length - i) * 4
              return (
                <div
                  key={img._key || i}
                  className="absolute w-full transition-all duration-100"
                  style={{
                    top: offset,
                    left: -offset,
                    zIndex: i,
                  }}
                >
                  <Image
                    src={url}
                    alt=""
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="w-full h-auto"
                  />
                </div>
              )
            })}
            {/* Main image on top */}
            <div 
              className={`relative ${isSelected ? 'cursor-zoom-in' : ''}`}
              style={{ zIndex: previewImages.length + 1 }}
              onClick={isSelected ? (e) => openLightbox(0, e) : undefined}
            >
              <Image
                src={mainImageUrl}
                alt={post.title}
                width={0}
                height={0}
                sizes="100vw"
                className="w-full h-auto"
              />
            </div>
          </div>
        )}

        {/* Text content on the right */}
        <div className="flex flex-col justify-between py-1 flex-1">
          <div>
            <p 
              className={`mb-1 transition-all duration-200 ${
                isSelected ? 'font-bold text-base' : 'font-normal text-sm'
              }`}
            >
              {post.title}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(post.date).getFullYear()}
            </p>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* View button */}
          <button className="self-end mt-2 text-xs flex items-center gap-1 border border-gray-300 py-0.5 px-2 hover:bg-gray-50">
            <span className={isHovered ? 'underline' : ''}>{isSelected ? 'Hide' : 'View'}</span>
            <ArrowUpRight 
              size={14} 
              className={`transition-transform duration-100 ${isSelected ? 'rotate-90' : isHovered ? 'rotate-45' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isSelected && (
        <div className="w-full sm:w-[500px] mt-6 space-y-6">
          {/* Body text */}
          {post.body && (
            <div className="prose prose-sm">
              <PortableText value={post.body} />
            </div>
          )}

          {/* Gallery images with captions */}
          {galleryImages.length > 0 && (
            <div className="space-y-4">
              {galleryImages.map((img, i) => {
                const url = urlForImage(img)?.url()
                if (!url) return null
                const hasCaption = !!img.caption
                // Index in allImages is i+1 because mainImage is at 0
                const lightboxIdx = post.mainImage?.asset ? i + 1 : i
                return (
                  <div 
                    key={img._key || i} 
                    className={`${hasCaption ? 'flex gap-4' : ''} cursor-zoom-in`}
                    onClick={(e) => openLightbox(lightboxIdx, e)}
                  >
                    <div className={hasCaption ? 'w-56 flex-shrink-0' : 'w-full'}>
                      <Image
                        src={url}
                        alt={img.alt || ''}
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto"
                      />
                    </div>
                    {hasCaption && (
                      <p className="text-xs text-gray-500 py-1">{img.caption}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={lightboxImages}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </div>
  )
}