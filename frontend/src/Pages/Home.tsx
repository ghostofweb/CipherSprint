import React from 'react'
import TypingBox from '../Components/TypingBox'
import Footer from '../Components/Footer'
import SiteHeader from '../Components/SiteHeader'
import { useTypingEngine } from '../Hooks/useTypingEngine'

function Home() {
  const engine = useTypingEngine()
  const hideChrome = engine.testStart && !engine.testEnd

  return (
    <div className="canvas">
      <SiteHeader
        hideChrome={hideChrome}
        idle={!engine.testStart && !engine.testEnd}
        onLogoClick={() => engine.resetTest()}
      />
      <main className="home-main">
        <h1 className="visually-hidden">CipherSprint typing test</h1>
        <TypingBox {...engine} />
      </main>
      <Footer hidden={hideChrome} />
    </div>
  )
}

export default Home
