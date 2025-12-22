import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { urlForImage } from '~/lib/sanity.image'

interface LightboxProps {
  images: Array<{
    asset: { _ref: string; _type: 'reference' }
    _key?: string
    _type: 'image'
    alt?: string
    caption?: string
  }>
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function Lightbox({ 
  images, 
  currentIndex, 
  onClose, 
  onNavigate 
}: LightboxProps) {
  const currentImage = images[currentIndex]
  const imageUrl = currentImage ? urlForImage(currentImage)?.url() : null

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length)
  }, [currentIndex, images.length, onNavigate])

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length)
  }, [currentIndex, images.length, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  if (!imageUrl) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-white flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
        <button
        onClick={onClose}
        className="absolute top-4 right-4 text-black border border-gray-300 p-2 hover:bg-gray-50  z-50"
        >
        <X size={16} />
        </button>

        {/* Previous arrow */}
        {images.length > 1 && (
        <button
            onClick={(e) => {
            e.stopPropagation()
            goPrev()
            }}
            className="absolute bottom-9 sm:bottom-auto left-4 text-black border border-gray-300 p-2 hover:bg-gray-50  z-50"
        >
            <ArrowLeft size={16} />
        </button>
        )}


      {/* Image */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imageUrl}
          alt={currentImage.alt || ''}
          width={0}
          height={0}
          sizes="90vw"
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
        />
        {currentImage.caption && (
        <p className="text-gray-600 text-sm mt-4">{currentImage.caption}</p>
        )}
        <p className="text-gray-400 text-xs mt-2">
        {currentIndex + 1} / {images.length}
        </p>
      </motion.div>

    {/* Next arrow */}
    {images.length > 1 && (
    <button
        onClick={(e) => {
        e.stopPropagation()
        goNext()
        }}
        className="absolute bottom-9 sm:bottom-auto right-4 text-black border border-gray-300 p-2 hover:bg-gray-50  z-50"
    >
        <ArrowRight size={16} />
    </button>
    )}
    </motion.div>
  )
}
