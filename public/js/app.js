console.log('app.js loaded');

document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing components...');
  
  // Initialize all animations and interactions
  initializeAnimations();
  initializeCarousel();
  initializeScrollEffects();
  initializeParallax();
  initializeTypingEffect();
});

// Typing effect for hero section
function initializeTypingEffect() {
  const heroTitle = document.querySelector('.hero h1');
  const text = heroTitle.textContent;
  heroTitle.textContent = '';
  
  let i = 0;
  const typeWriter = () => {
    if (i < text.length) {
      heroTitle.textContent += text.charAt(i);
      i++;
      setTimeout(typeWriter, 100);
    }
  };
  
  typeWriter();
}

// Parallax effect
function initializeParallax() {
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
          const speed = element.dataset.speed || 0.2; // Reduced speed
          const yPos = -(scrolled * speed);
          element.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        
        ticking = false;
      });
      
      ticking = true;
    }
  });
}

// Scroll animations
function initializeScrollEffects() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(element => {
    observer.observe(element);
  });
}

// Enhanced carousel functionality
function initializeCarousel() {
  console.log('Initializing carousel...');
  
  const carousel = document.querySelector('.carousel');
  const cards = document.querySelectorAll('.tutorial-card');
  const leftBtn = document.querySelector('.carousel-btn.left');
  const rightBtn = document.querySelector('.carousel-btn.right');
  
  console.log('Carousel elements found:', {
    carousel: !!carousel,
    cards: cards.length,
    leftBtn: !!leftBtn,
    rightBtn: !!rightBtn
  });
  
  if (carousel && cards.length && leftBtn && rightBtn) {
  let currentIndex = 0;
    let isAnimating = false;
    let cardWidth = cards[0].offsetWidth;
    const cardMargin = 30;
    const totalCards = cards.length;

    function updateCarousel(direction) {
      console.log('Button clicked:', direction);
      
      if (isAnimating) return;
      
    const oldIndex = currentIndex;
      const visibleCards = window.innerWidth <= 768 ? 1 : window.innerWidth <= 1024 ? 2 : 3;
    
    if (direction === 'left' && currentIndex > 0) {
      currentIndex--;
      } else if (direction === 'right' && currentIndex < totalCards - visibleCards) {
      currentIndex++;
    }

    if (oldIndex !== currentIndex) {
        isAnimating = true;
      const offset = currentIndex * (cardWidth + cardMargin);
        
      carousel.style.transition = 'transform 0.5s ease';
      carousel.style.transform = `translateX(-${offset}px)`;
      
      // Update button states
        leftBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        leftBtn.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
        
        rightBtn.style.opacity = currentIndex >= totalCards - visibleCards ? '0.5' : '1';
        rightBtn.style.pointerEvents = currentIndex >= totalCards - visibleCards ? 'none' : 'auto';
        
        setTimeout(() => {
          isAnimating = false;
        }, 500);
      }
    }

    // Add click handlers
    leftBtn.onclick = function(e) {
      e.preventDefault();
    updateCarousel('left');
    };

    rightBtn.onclick = function(e) {
      e.preventDefault();
    updateCarousel('right');
    };

    // Handle window resize
    window.onresize = function() {
      cardWidth = cards[0].offsetWidth;
      const offset = currentIndex * (cardWidth + cardMargin);
    carousel.style.transition = 'none';
    carousel.style.transform = `translateX(-${offset}px)`;
    };

    // Initialize
    carousel.style.transform = 'translateX(0)';
    console.log('Carousel initialized');
  }
}

// Initialize all animations
function initializeAnimations() {
  // Add animation classes to elements
  document.querySelectorAll('.tutorial-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.15}s`;
    card.classList.add('animate-on-scroll');
  });

  document.querySelectorAll('.how-it-card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
    card.classList.add('animate-on-scroll');
  });

  // Add parallax class to elements with reduced effect
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  
  if (hero) {
    hero.classList.add('parallax');
    hero.dataset.speed = '0.1'; // Very subtle parallax
  }
  
  if (heroContent) {
    heroContent.classList.add('parallax');
    heroContent.dataset.speed = '0.05'; // Even more subtle
  }
  
  // Smooth scroll for navigation
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// Theme toggle functionality
const darkModeToggle = document.createElement('button');
darkModeToggle.className = 'dark-mode-toggle';
darkModeToggle.innerHTML = '🌙';
document.querySelector('.header').appendChild(darkModeToggle);

const toggleTheme = () => {
  const isDarkMode = document.body.classList.contains('dark-mode');
  document.body.classList.toggle('dark-mode');
  document.body.classList.toggle('light-mode');
  darkModeToggle.innerHTML = isDarkMode ? '☀️' : '🌙';
  localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  
  // Add transition class
  document.body.classList.add('theme-transition');
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 500);
};

darkModeToggle.addEventListener('click', toggleTheme);

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.body.classList.add('light-mode');
  darkModeToggle.innerHTML = '☀️';
} else {
  document.body.classList.add('dark-mode');
  darkModeToggle.innerHTML = '🌙';
}