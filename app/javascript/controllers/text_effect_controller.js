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
        this.size = this.calculateSize()
      }

      calculateSize() {
        // スマートフォンではより小さなパーティクルに
        return window.innerWidth < 768 ? 0.6 : 1.2
      }

      update() {
        // モバイルでは動きを少し速く
        const speed = window.innerWidth < 768 ? 0.025 : 0.02
        const randomSpeedX = 2 + Math.random() * 10
        const randomSpeedY = 2 + Math.random() * 10

        this.dx = (this.targetX - this.x) * speed * randomSpeedX
        this.dy = (this.targetY - this.y) * speed * randomSpeedY
        this.x += this.dx
        this.y += this.dy
      }

      draw(ctx) {
        ctx.shadowColor = '#ffffff'
        ctx.shadowBlur = window.innerWidth < 768 ? 1.5 : 3
        
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }

      setTarget(x, y) {
        this.targetX = x
        this.targetY = y
      }

      setRandomTarget(width, height, spread = 300) {
        const spreadFactor = window.innerWidth < 768 ? 0.7 : 1
        this.targetX = width/2 + (Math.random() - 0.5) * spread * spreadFactor
        this.targetY = height/2 + (Math.random() - 0.5) * spread * spreadFactor
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
        this.transitionDuration = window.innerWidth < 768 ? 4000 : 5500
        this.particleSpacing = window.innerWidth < 768 ? 3 : 4  // パーティクルの間隔を縮小
        this.baseParticleCount = window.innerWidth < 768 ? 2500 : 2000  // モバイルではパーティクル数を増加
        this.isTransitioning = false
        this.transitionStartTime = 0
        this.spreadDuration = window.innerWidth < 768 ? 800 : 1000
        this.gatherDuration = window.innerWidth < 768 ? 1600 : 2000
        this.isInitialized = false

        this.resize()
        window.addEventListener('resize', () => {
          this.resize()
          this.updateParticleProperties()
        })
        
        this.initParticles()
        this.animate()

        document.fonts.ready.then(() => {
          this.startInitialTransition()
        })
      }

      updateParticleProperties() {
        this.particles.forEach(particle => {
          particle.size = particle.calculateSize()
        })
      }

      resize() {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
      }

      getTextPoints(text) {
        // フォントサイズの設定
        const fontSize = Math.min(
          this.canvas.width / (window.innerWidth < 768 ? 4 : 8),
          window.innerWidth < 768 ? 140 : 120
        )
        this.ctx.font = `500 ${fontSize}px "Rajdhani"`
        
        const tempCanvas = document.createElement('canvas')
        const tempCtx = tempCanvas.getContext('2d')
        tempCanvas.width = this.canvas.width
        tempCanvas.height = this.canvas.height
        
        tempCtx.fillStyle = '#fff'
        tempCtx.font = this.ctx.font
        tempCtx.textAlign = 'center'
        tempCtx.textBaseline = 'middle'
    
        // テキストを行に分割
        const lines = text.split('\n')
        const lineHeight = fontSize * 1.2 // 行間を設定
        const totalHeight = lineHeight * (lines.length - 1)
        
        // 各行を描画
        lines.forEach((line, i) => {
          const y = tempCanvas.height/2 - totalHeight/2 + i * lineHeight
          tempCtx.fillText(line, tempCanvas.width/2, y)
        })
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
        const points = new Set()
        const gap = this.particleSpacing
        let pixelCount = 0
        
        for (let y = 0; y < tempCanvas.height; y += gap) {
          for (let x = 0; x < tempCanvas.width; x += gap) {
            const i = (y * tempCanvas.width + x) * 4
            if (imageData.data[i + 3] > 128) {
              const key = `${Math.round(x/gap)*gap},${Math.round(y/gap)*gap}`
              points.add(key)
              pixelCount++
            }
          }
        }

        // モバイルでは最小・最大パーティクル数を増加
        const minParticles = window.innerWidth < 768 ? 1500 : 1500
        const maxParticles = window.innerWidth < 768 ? 3500 : 3000
        this.maxParticles = Math.floor(this.baseParticleCount * (pixelCount / 500))
        this.maxParticles = Math.min(Math.max(this.maxParticles, minParticles), maxParticles)
    
        return Array.from(points).map(point => {
          const [x, y] = point.split(',').map(Number)
          return {x, y}
        })
      }

      initParticles() {
        const initialCount = window.innerWidth < 768 ? 2500 : 2000
        for (let i = 0; i < initialCount; i++) {
          const x = this.canvas.width/2 + (Math.random() - 0.5) * 1600
          const y = this.canvas.height/2 + (Math.random() - 0.5) * 1600
          this.particles.push(new Particle(x, y))
        }
      }

      spreadParticles() {
        const spread = window.innerWidth < 768 ? 1200 : 1600
        this.particles.forEach(particle => {
          particle.setRandomTarget(this.canvas.width, this.canvas.height, spread)
        })
      }

      updateTextPoints(text) {
        const points = this.getTextPoints(text)
        
        while (this.particles.length > this.maxParticles) {
          this.particles.pop()
        }
        
        while (this.particles.length < Math.min(points.length, this.maxParticles)) {
          const x = this.canvas.width/2 + (Math.random() - 0.5) * 300
          const y = this.canvas.height/2 + (Math.random() - 0.5) * 300
          this.particles.push(new Particle(x, y))
        }
        
        const stride = points.length / this.particles.length
        this.particles.forEach((particle, i) => {
          const pointIndex = Math.floor(i * stride)
          const point = points[pointIndex % points.length]
          if (point) {
            particle.setTarget(point.x, point.y)
          }
        })
      }

      startInitialTransition() {
        this.isTransitioning = true
        this.transitionStartTime = Date.now()
        
        const spread = window.innerWidth < 768 ? 1200 : 1600
        this.particles.forEach(particle => {
          particle.x = this.canvas.width/2 + (Math.random() - 0.5) * spread
          particle.y = this.canvas.height/2 + (Math.random() - 0.5) * spread
          particle.setRandomTarget(this.canvas.width, this.canvas.height, spread)
        })

        setTimeout(() => {
          this.updateTextPoints(this.texts[0])
          setTimeout(() => {
            this.isTransitioning = false
            this.isInitialized = true
            this.lastTextChange = Date.now()
          }, this.gatherDuration)
        }, this.spreadDuration)
      }

      startTransition() {
        this.isTransitioning = true
        this.transitionStartTime = Date.now()
        this.spreadParticles()

        setTimeout(() => {
          this.updateTextPoints(this.texts[this.currentTextIndex])
          setTimeout(() => {
            this.isTransitioning = false
          }, this.gatherDuration)
        }, this.spreadDuration)
      }

      animate() {
        const now = Date.now()
        if (!this.isTransitioning && this.isInitialized && now - this.lastTextChange > this.transitionDuration) {
          this.currentTextIndex = (this.currentTextIndex + 1) % this.texts.length
          this.textChangeCount++
          
          if (this.textChangeCount >= 5) {
            this.currentTextIndex = 0
            this.textChangeCount = 0
          }
          
          this.lastTextChange = now
          this.startTransition()
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