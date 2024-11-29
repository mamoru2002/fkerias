// app/javascript/controllers/text_effect_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.initTextEffect()
  }

  initTextEffect() {
    class Particle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.targetX = x
        this.targetY = y
        this.dx = 0
        this.dy = 0
        this.size = 1.2
      }

      update() {
        this.dx = (this.targetX - this.x) * 0.04
        this.dy = (this.targetY - this.y) * 0.04
        this.x += this.dx
        this.y += this.dy
      }

      draw(ctx) {
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = 3
        
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
      }

      setTarget(x, y) {
        this.targetX = x
        this.targetY = y
      }
    }

    class TextEffect {
      constructor(canvas, texts) {
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.particles = []
        this.texts = texts
        this.currentTextIndex = 0
        this.textChangeCount = 0
        this.lastTextChange = 0
        this.transitionDuration = 8000
        this.particleSpacing = 4

        this.resize()
        window.addEventListener('resize', () => this.resize())
        
        this.initParticles()
        this.animate()

        document.fonts.ready.then(() => {
          this.updateTextPoints(this.texts[0])
        })
      }

      resize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
      }

      getTextPoints(text) {
        const fontSize = Math.min(this.canvas.width / 10, 120)
        this.ctx.font = `bold ${fontSize}px "Russo One"`
        
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = this.canvas.width
        tempCanvas.height = this.canvas.height
        
        tempCtx.fillStyle = '#fff'
        tempCtx.font = this.ctx.font
        tempCtx.textAlign = 'center'
        tempCtx.textBaseline = 'middle'
        tempCtx.fillText(text, tempCanvas.width/2, tempCanvas.height/2)
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const points = new Set()
        const gap = 4
        
        for (let y = 0; y < tempCanvas.height; y += gap) {
          for (let x = 0; x < tempCanvas.width; x += gap) {
            const i = (y * tempCanvas.width + x) * 4
            if (imageData.data[i + 3] > 128) {
              const key = `${Math.round(x/gap)*gap},${Math.round(y/gap)*gap}`
              points.add(key)
            }
          }
        }

        return Array.from(points).map(point => {
          const [x, y] = point.split(',').map(Number)
          return {x, y}
        })
      }

      initParticles() {
        for (let i = 0; i < 3000; i++) {
          const x = this.canvas.width/2 + (Math.random() - 0.5) * 300
          const y = this.canvas.height/2 + (Math.random() - 0.5) * 300
          this.particles.push(new Particle(x, y))
        }
      }

      updateTextPoints(text) {
        const points = this.getTextPoints(text)
        
        const maxParticles = 3000
        while (this.particles.length > maxParticles) {
          this.particles.pop()
        }
        
        while (this.particles.length < Math.min(points.length, maxParticles)) {
          const x = this.canvas.width/2 + (Math.random() - 0.5) * 300
          const y = this.canvas.height/2 + (Math.random() - 0.5) * 300
          this.particles.push(new Particle(x, y))
        }
        
        this.particles.forEach((particle, i) => {
          const point = points[i % points.length]
          if (point) {
            particle.setTarget(point.x, point.y)
          }
        })
      }

      animate() {
        const now = Date.now()
        if (now - this.lastTextChange > this.transitionDuration) {
          this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length
          this.textChangeCount++
          
          if (this.textChangeCount >= 5) {
            this.currentTextIndex = 0
            this.textChangeCount = 0
          }
          
          this.updateTextPoints(this.texts[this.currentTextIndex])
          this.lastTextChange = now
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        this.particles.forEach(particle => {
          particle.update()
          particle.draw(this.ctx)
        })

        requestAnimationFrame(() => this.animate())
      }
    }

    const canvas = this.element
    const texts = JSON.parse(this.element.dataset.texts)
    new TextEffect(canvas, texts)
  }
}