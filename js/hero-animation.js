document.addEventListener("DOMContentLoaded", function () {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) return;

  // Create Canvas Element
  const canvas = document.createElement("canvas");
  canvas.id = "hero-particles";
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "0"; // Behind content
  canvas.style.pointerEvents = "none";
  heroSection.insertBefore(canvas, heroSection.firstChild);

  const ctx = canvas.getContext("2d");
  let width, height;
  let particles = [];

  // Configuration
  const particleCount = 60; // Number of particles
  const connectionDistance = 150; // Distance to connect lines
  const moveSpeed = 0.5; // Speed factor

  // Resize Handler
  function resize() {
    width = canvas.width = heroSection.offsetWidth;
    height = canvas.height = heroSection.offsetHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Particle Class
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * moveSpeed;
      this.vy = (Math.random() - 0.5) * moveSpeed;
      this.size = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.1;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
    }
  }

  // Initialize Particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(34, 197, 94, ${1 - dist / connectionDistance})`; // Green tint connecting lines
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Update and Draw Particles
    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();
});

// Dynamic Typing Effect
document.addEventListener("DOMContentLoaded", function () {
  const headline = document.querySelector(".hero-content h1");
  if (!headline) return;

  const originalText = "Trusted one-stop supplier of ";
  const dynamicWords = ["Industrial Gases", "Safety Equipment", "Cylinder Refilling"];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  // Clear existing content and set up structure
  headline.innerHTML = `${originalText}<span class="dynamic-text"></span><span class="cursor">|</span>`;
  const dynamicSpan = headline.querySelector(".dynamic-text");
  
  // Styling for the dynamic part
  dynamicSpan.style.color = "var(--primary)";
  dynamicSpan.style.fontWeight = "800";

  function type() {
    const currentWord = dynamicWords[wordIndex];
    
    if (isDeleting) {
      dynamicSpan.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50; // Faster when deleting
    } else {
      dynamicSpan.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100; // Normal typing speed
    }

    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end of word
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % dynamicWords.length;
      typeSpeed = 500; // Pause before typing next word
    }

    setTimeout(type, typeSpeed);
  }

  // Start typing loop
  setTimeout(type, 1000);
});
