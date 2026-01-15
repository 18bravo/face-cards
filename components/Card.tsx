'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import Image from 'next/image'

interface CardProps {
  photoUrl: string
  title: string
  name: string
  isFlipped: boolean
  onFlip: () => void
}

export function Card({ photoUrl, title, name, isFlipped, onFlip }: CardProps) {
  return (
    <div
      className="relative w-full max-w-sm h-96 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front - Photo and Title */}
        <div
          className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-xl p-4 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="relative w-48 h-48 rounded-full overflow-hidden mb-4 border-4 border-gray-200">
            <Image
              src={photoUrl}
              alt="Leader photo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="text-center text-gray-700 font-medium px-2">{title}</p>
          <p className="text-sm text-gray-400 mt-4">Tap to reveal name</p>
        </div>

        {/* Back - Name */}
        <div
          className="absolute inset-0 backface-hidden bg-blue-600 rounded-2xl shadow-xl p-4 flex items-center justify-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <h2 className="text-2xl font-bold text-white text-center px-4">
            {name}
          </h2>
        </div>
      </motion.div>
    </div>
  )
}
