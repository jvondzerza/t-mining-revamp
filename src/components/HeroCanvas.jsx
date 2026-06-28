import { useEffect, useRef } from 'react'
// The hero canvas scene — the instanced port-yard
import HeroScene from '../three/PortYardScene'

export default function HeroCanvas() {
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const mobile = window.innerWidth < 768

    let scene
    // defer one frame so layout (clientWidth/Height) is settled
    const id = requestAnimationFrame(() => {
      try {
        scene = new HeroScene(canvas, { mobile })
        sceneRef.current = scene
        if (reduce) scene.pause()
      } catch (err) {
        // WebGL unavailable / context lost — leave the CSS gradient as backdrop
        if (process.env.NODE_ENV !== 'production') console.warn('[HeroScene] init failed:', err?.message)
      }
    })

    // pause when the hero scrolls out of view
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!sceneRef.current || reduce) return
        if (entry.isIntersecting) sceneRef.current.resume()
        else sceneRef.current.pause()
      },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onMove = (e) => {
      if (!sceneRef.current) return
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      sceneRef.current.setPointer(nx, ny)
    }
    window.addEventListener('pointermove', onMove)

    const onVisibility = () => {
      if (!sceneRef.current || reduce) return
      if (document.hidden) sceneRef.current.pause()
      else sceneRef.current.resume()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(id)
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  return <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
}
