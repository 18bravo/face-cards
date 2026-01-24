'use client'

import { Player } from '@remotion/player'
import { HeroLoop } from '@/remotion/HeroLoop'

interface VideoBackgroundProps {
  opacity?: number
  scale?: number
}

export default function VideoBackground({ opacity = 1, scale = 1 }: VideoBackgroundProps) {
  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <Player
        component={HeroLoop}
        durationInFrames={300}
        compositionWidth={1920}
        compositionHeight={1080}
        fps={30}
        loop
        autoPlay
        style={{
          width: '100%',
          height: '100%',
        }}
        controls={false}
      />
    </div>
  )
}
