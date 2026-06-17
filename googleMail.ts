@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Geist:wght@400;600;700&display=swap');

@theme {
  --font-sora: "Sora", sans-serif;
  --font-plus: "Plus Jakarta Sans", sans-serif;
  --font-geist: "Geist", monospace;
}

@layer utilities {
  .glass-dark {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .glass-light {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(251, 146, 60, 0.15);
    box-shadow: 0 10px 30px -10px rgba(120, 53, 4, 0.05);
  }

  .glow-orange {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .glow-orange:hover {
    box-shadow: 0 0 25px rgba(255, 92, 0, 0.35);
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}

/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
}

/* Custom Scrollbar for non-Chrome or custom viewports */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #131313;
}
::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #ff5c00;
}

/* Animations helper */
@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

.pulsing-glow {
  animation: pulseGlow 3s infinite ease-in-out;
}
