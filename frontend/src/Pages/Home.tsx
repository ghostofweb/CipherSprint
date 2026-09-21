import React, { useState } from 'react'
import TypingBox from '../Components/TypingBox'
import Footer from '../Components/Footer'
import ThemePickerModal from '../Components/ThemePickerModal'
import SiteHeader from '../Components/SiteHeader'
import { useTypingEngine } from '../Hooks/useTypingEngine'

function Home() {
  const engine = useTypingEngine()
  const hideChrome = engine.testStart && !engine.testEnd
  const [themePickerOpen, setThemePickerOpen] = useState(false)

  return (
    <div className="canvas">
      <SiteHeader
        hideChrome={hideChrome}
        onLogoClick={() => engine.resetTest()}
        onOpenTheme={() => setThemePickerOpen(true)}
      />
      <main className="home-main">
        <TypingBox {...engine} />
      </main>
      <Footer hidden={hideChrome} onOpenThemePicker={() => setThemePickerOpen(true)} />
      <ThemePickerModal open={themePickerOpen} onClose={() => setThemePickerOpen(false)} />
    </div>
  )
}

export default Home
