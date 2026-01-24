import { Composition } from 'remotion'
import { AuthorityFlow } from './AuthorityFlow'
import { HeroLoop } from './HeroLoop'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AuthorityFlow"
        component={AuthorityFlow}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="HeroLoop"
        component={HeroLoop}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
