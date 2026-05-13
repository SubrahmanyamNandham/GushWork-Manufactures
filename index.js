/**
 * script.js — Mangalam HDPE Pipes
 * Handles:
 *  1. Sticky header (show/hide on scroll)
 *  2. Product image carousel with thumbnail sync
 *  3. Carousel zoom-on-hover feature
 *  4. Applications horizontal carousel
 *  5. Mobile nav hamburger
 *  6. Manufacturing process tab switcher
 *  7. FAQ accordion
 *  8. Modal open/close
 */

/* ════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════ */
/**
 * Debounce — limits how often a function fires.
 * @param {Function} fn
 * @param {number} delay
 */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/* ════════════════════════════════════════════
   1. STICKY HEADER
   - Appears when user scrolls past the hero fold
   - Disappears when scrolling back to the top
════════════════════════════════════════════ */
(function initStickyHeader() {
  const stickyHeader = document.getElementById('stickyHeader');
  const hero         = document.getElementById('hero');
  if (!stickyHeader || !hero) return;

  let lastScrollY = window.scrollY;

  function handleScroll() {
    const scrollY        = window.scrollY;
    const heroBottom     = hero.offsetTop + hero.offsetHeight;
    const scrollingUp    = scrollY < lastScrollY;

    if (scrollY > heroBottom) {
      // Past the hero — show sticky header
      stickyHeader.classList.add('visible');
    } else {
      // Back in the hero — hide sticky header
      stickyHeader.classList.remove('visible');
    }

    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load
})();


/* ════════════════════════════════════════════
   2. PRODUCT IMAGE CAROUSEL
   - Slide left / right via prev/next buttons
   - Thumbnail click jumps to slide
   - Touch/swipe support
════════════════════════════════════════════ */
(function initProductCarousel() {
  const track      = document.getElementById('carouselTrack');
  const prevBtn    = document.getElementById('prevBtn');
  const nextBtn    = document.getElementById('nextBtn');
  const thumbsWrap = document.getElementById('carouselThumbs');
  if (!track) return;

  const slides     = track.querySelectorAll('.carousel__slide');
  const thumbs     = thumbsWrap ? thumbsWrap.querySelectorAll('.carousel__thumb') : [];
  let current      = 0;
  const total      = slides.length;

  /**
   * Move carousel to a specific slide index.
   * @param {number} index
   */
  function goTo(index) {
    // Clamp within bounds (no infinite loop — straightforward UX)
    if (index < 0)      index = 0;
    if (index >= total) index = total - 1;
    current = index;

    // Translate track
    track.style.transform = `translateX(-${current * 100}%)`;

    // Update thumbnails
    thumbs.forEach((th, i) => {
      th.classList.toggle('active', i === current);
    });
  }

  // Prev / Next buttons
  prevBtn && prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener('click', () => goTo(current + 1));

  // Thumbnail clicks
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = parseInt(thumb.dataset.index, 10);
      goTo(idx);
    });
  });

  // Touch / swipe support
  let touchStartX = 0;
  track.parentElement.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.parentElement.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      goTo(diff > 0 ? current + 1 : current - 1);
    }
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  goTo(current - 1);
    if (e.key === 'ArrowRight') goTo(current + 1);
  });

  goTo(0); // initialise
})();


/* ════════════════════════════════════════════
   3. ZOOM-ON-HOVER FOR CAROUSEL
   - When cursor hovers the carousel, a zoomed
     view appears to the right (or below on mobile)
   - Zoom position tracks cursor movement inside
     the image
════════════════════════════════════════════ */
(function initCarouselZoom() {
  const carousel    = document.getElementById('carousel');
  const zoomPreview = document.getElementById('zoomPreview');
  const zoomImg     = document.getElementById('zoomImg');
  const track       = document.getElementById('carouselTrack');
  if (!carousel || !zoomPreview || !zoomImg) return;

  /**
   * Get the currently visible slide's image element.
   * @returns {HTMLImageElement|null}
   */
  function getActiveImg() {
    const slides  = track.querySelectorAll('.carousel__slide');
    const current = parseInt(
      ((parseFloat(track.style.transform.replace('translateX(', '')) || 0) * -1) / 100,
      10
    ) || 0;
    return slides[current] ? slides[current].querySelector('.carousel__img') : null;
  }

  /**
   * On mouse enter: load the hi-res image and show the preview panel.
   */
  carousel.addEventListener('mouseenter', () => {
    const img = getActiveImg();
    if (!img) return;
    const hiRes = img.dataset.zoom || img.src;
    zoomImg.src = hiRes;
    zoomPreview.classList.add('active');
  });

  /**
   * On mouse leave: hide the preview.
   */
  carousel.addEventListener('mouseleave', () => {
    zoomPreview.classList.remove('active');
  });

  /**
   * On mouse move: update zoom image position so it feels like
   * a magnifying glass — the part of the image under the cursor
   * is centred in the preview box.
   *
   * @param {MouseEvent} e
   */
  carousel.addEventListener('mousemove', e => {
    const rect   = carousel.getBoundingClientRect();
    // Relative cursor position (0–1)
    const xRatio = (e.clientX - rect.left)  / rect.width;
    const yRatio = (e.clientY - rect.top)   / rect.height;

    // The zoom image is 200% × 200% of the preview container (set in CSS).
    // We offset it so the relevant portion is centred.
    // Formula: offset = ratio × (imageSize - containerSize)
    // imageSize = 200%, containerSize = 100%, so offsetMax = 100%
    const xOffset = xRatio * 100;
    const yOffset = yRatio * 100;

    zoomImg.style.transform = `translate(-${xOffset}%, -${yOffset}%)`;
  });

  // Also refresh zoomed image when carousel slide changes
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  [prevBtn, nextBtn].forEach(btn => {
    btn && btn.addEventListener('click', () => {
      // Small delay to let track transition finish
      setTimeout(() => {
        if (zoomPreview.classList.contains('active')) {
          const img = getActiveImg();
          if (img) zoomImg.src = img.dataset.zoom || img.src;
        }
      }, 460);
    });
  });
})();


/* ════════════════════════════════════════════
   4. APPLICATIONS CAROUSEL (horizontal scroll)
════════════════════════════════════════════ */
(function initAppCarousel() {
  const carousel = document.getElementById('appCarousel');
  const prevBtn  = document.getElementById('appPrev');
  const nextBtn  = document.getElementById('appNext');
  if (!carousel) return;

  const SCROLL_AMOUNT = 340; // px per click (~card width)

  prevBtn && prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  });

  nextBtn && nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  });
})();


/* ════════════════════════════════════════════
   5. MOBILE NAV HAMBURGER
════════════════════════════════════════════ */
(function initMobileNav() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a link is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
})();


/* ════════════════════════════════════════════
   6. MANUFACTURING PROCESS TABS
════════════════════════════════════════════ */
(function initProcessTabs() {
  const tabsContainer = document.getElementById('processTabs');
  if (!tabsContainer) return;

  const tabs   = tabsContainer.querySelectorAll('.process-tab');
  const panels = document.querySelectorAll('.process-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const step = tab.dataset.step;

      // Update tab active state
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show matching panel
      panels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === step);
      });
    });
  });
})();


/* ════════════════════════════════════════════
   7. FAQ ACCORDION
════════════════════════════════════════════ */
(function initFAQ() {
  const faqList = document.querySelector('.faq-list');
  if (!faqList) return;

  faqList.querySelectorAll('.faq-item__q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item    = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      // Close all items
      faqList.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
      });

      // If it wasn't open before, open it now
      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();


/* ════════════════════════════════════════════
   8. MODAL SYSTEM
════════════════════════════════════════════ */
(function initModals() {
  const overlay         = document.getElementById('modalOverlay');
  const catalogueModal  = document.getElementById('catalogueModal');
  const callbackModal   = document.getElementById('callbackModal');
  if (!overlay) return;

  /**
   * Open a specific modal.
   * @param {HTMLElement} modal
   */
  function openModal(modal) {
    modal.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus the first input inside modal
    const firstInput = modal.querySelector('input, select, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  /**
   * Close all modals.
   */
  function closeAll() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Overlay click closes modals
  overlay.addEventListener('click', closeAll);

  // Individual close buttons
  document.getElementById('catalogueModalClose') &&
    document.getElementById('catalogueModalClose').addEventListener('click', closeAll);
  document.getElementById('callbackModalClose') &&
    document.getElementById('callbackModalClose').addEventListener('click', closeAll);

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });

  // Expose globally for inline onclick if needed
  window.openCatalogueModal = () => openModal(catalogueModal);
  window.openCallbackModal  = () => openModal(callbackModal);
})();


/* ════════════════════════════════════════════
   9. SCROLL REVEAL (lightweight)
   - Adds .revealed class when element enters
     the viewport; CSS handles the animation
════════════════════════════════════════════ */
(function initScrollReveal() {
  // Only run if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) return;

  // Add base hidden style via JS so that without JS elements are fully visible
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(24px);
      transition: opacity 0.55s ease, transform 0.55s ease;
    }
    .reveal.revealed {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const targets = document.querySelectorAll(
    '.feature-card, .testimonial-card, .product-card, .app-card, .resource-item, .faq-item'
  );

  targets.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
})();