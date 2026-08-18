import recipes from './data/recipes.json';
import categories from './data/categories.json';

document.addEventListener('DOMContentLoaded', () => {
  const sliderContainer = document.getElementById('sliderContainer');
  const sliderDots = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const recipeGrid = document.getElementById('recipeGrid');
  const categoryFilters = document.getElementById('categoryFilters');
  const searchInput = document.getElementById('searchInput');
  const recipeModal = document.getElementById('recipeModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalBody = document.getElementById('modalBody');

  let currentSlide = 0;
  let autoplayInterval;
  let isSliderHovered = false;
  const sliderRecipes = recipes.slice(0, 5);

  // Slider Logic
  const initSlider = () => {
    if (sliderRecipes.length === 0) return;
    
    sliderContainer.innerHTML = '';
    sliderDots.innerHTML = '';

    sliderRecipes.forEach((recipe, index) => {
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.setAttribute('data-id', recipe.id);
      slide.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" class="slide-bg">
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <span class="slide-tag">Nuevo</span>
          <h2 class="slide-title">${recipe.title}</h2>
          <p class="slide-desc">${recipe.description}</p>
        </div>
      `;
      sliderContainer.appendChild(slide);

      const dot = document.createElement('div');
      dot.className = `dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      sliderDots.appendChild(dot);
    });

    startAutoplay();
  };

  const goToSlide = (index) => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if(slides.length === 0) return;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = index;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    resetAutoplay();
  };

  const nextSlide = () => {
    if(sliderRecipes.length === 0) return;
    let nextIndex = (currentSlide + 1) % sliderRecipes.length;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    if(sliderRecipes.length === 0) return;
    let prevIndex = (currentSlide - 1 + sliderRecipes.length) % sliderRecipes.length;
    goToSlide(prevIndex);
  };

  const startAutoplay = () => {
    if(sliderRecipes.length > 1 && !isSliderHovered) {
      autoplayInterval = setInterval(nextSlide, 5000);
    }
  };

  const resetAutoplay = () => {
    clearInterval(autoplayInterval);
    startAutoplay();
  };

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
  }

  const heroSlider = document.getElementById('heroSlider');
  if (heroSlider) {
    heroSlider.addEventListener('mouseenter', () => {
      isSliderHovered = true;
      clearInterval(autoplayInterval);
    });
    heroSlider.addEventListener('mouseleave', () => {
      isSliderHovered = false;
      startAutoplay();
    });
  }
  
  if (sliderContainer) {
    initSlider();
  }

  // Cards Logic
  const renderRecipes = (recipesToRender) => {
    recipeGrid.innerHTML = '';
    
    if (recipesToRender.length === 0) {
      recipeGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 1.2rem;">No se encontraron recetas.</p>';
      return;
    }

    recipesToRender.forEach((recipe, index) => {
      const card = document.createElement('article');
      card.className = 'recipe-card';
      card.style.animationDelay = `${index * 0.1}s`;
      card.setAttribute('data-id', recipe.id);
      
      const timeIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
      const diffIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;

      const categoryText = Array.isArray(recipe.category) 
        ? recipe.category.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
        : recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1);

      card.innerHTML = `
        <div class="recipe-img-container">
          <span class="recipe-category">${categoryText}</span>
          <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img" loading="lazy">
        </div>
        <div class="recipe-content">
          <h3 class="recipe-title">${recipe.title}</h3>
          <p class="recipe-desc">${recipe.description}</p>
          <div class="recipe-meta">
            <span>${timeIcon} ${recipe.time}</span>
            <span>${diffIcon} ${recipe.difficulty}</span>
          </div>
        </div>
      `;
      recipeGrid.appendChild(card);
    });
  };

  renderRecipes(recipes);

  const categorySelect = document.getElementById('categorySelect');

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.setAttribute('data-category', cat);
    btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilters.appendChild(btn);

    if (categorySelect) {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      categorySelect.appendChild(option);
    }
  });

  const filterBtns = document.querySelectorAll('.filter-btn');

  const applyFilters = (category, searchTerm) => {
    const filtered = recipes.filter(r => {
      const matchesCategory = category === 'all' || 
        (Array.isArray(r.category) ? r.category.includes(category) : r.category === category);
      const matchesSearch = r.title.toLowerCase().includes(searchTerm) || 
        r.description.toLowerCase().includes(searchTerm);
      return matchesCategory && matchesSearch;
    });
    renderRecipes(filtered);
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      const searchTerm = searchInput.value.toLowerCase();
      if (categorySelect) categorySelect.value = category;
      applyFilters(category, searchTerm);
    });
  });

  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      const category = e.target.value;
      const searchTerm = searchInput.value.toLowerCase();
      
      filterBtns.forEach(b => {
        if (b.getAttribute('data-category') === category) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });

      applyFilters(category, searchTerm);
    });
  }

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const activeBtn = document.querySelector('.filter-btn.active');
    const category = activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    applyFilters(category, searchTerm);
  });

  // Modal Logic
  const formatForRender = (data, isOrdered = false) => {
    if (Array.isArray(data)) {
      return data.map((item, index) => isOrdered ? `${index + 1}. ${item}` : `- ${item}`).join('\n');
    }
    return data || '';
  };

  let currentRecipeForShare = null;

  const openModal = (recipe) => {
    currentRecipeForShare = recipe;
    history.pushState(null, '', '?id=' + recipe.id);

    const timeIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
    const diffIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;

    const ingredientsHtml = marked.parse(formatForRender(recipe.ingredients, false));
    const instructionsHtml = marked.parse(formatForRender(recipe.instructions, true));

    modalBody.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" class="modal-header-img">
      <div class="modal-body-content">
        <h2 class="modal-title">${recipe.title}</h2>
        <div class="modal-meta">
          <span>${timeIcon} ${recipe.time}</span>
          <span>${diffIcon} ${recipe.difficulty}</span>
        </div>
        <p style="font-size: 1.1rem; color: var(--text-secondary); line-height: 1.6;">${recipe.description}</p>
        
        <h3 class="modal-section-title">Ingredientes</h3>
        <div class="markdown-body">
          ${ingredientsHtml}
        </div>
        
        <h3 class="modal-section-title">Instrucciones</h3>
        <div class="markdown-body">
          ${instructionsHtml}
        </div>
      </div>
    `;
    document.body.style.overflow = 'hidden'; 
    recipeModal.classList.add('active');
  };

  const closeModal = () => {
    document.body.style.overflow = 'auto'; 
    recipeModal.classList.remove('active');
    history.pushState(null, '', window.location.pathname);
    const shareMenu = document.getElementById('shareMenu');
    if (shareMenu) shareMenu.classList.remove('active');
  };

  closeModalBtn.addEventListener('click', closeModal);
  recipeModal.addEventListener('click', (e) => {
    if (e.target === recipeModal) closeModal();
  });

  // About Modal Logic
  const aboutModal = document.getElementById('aboutModal');
  const closeAboutModal = document.getElementById('closeAboutModal');
  const siteLogo = document.querySelector('.slider-logo');

  if (siteLogo) {
    siteLogo.addEventListener('click', () => {
      document.body.style.overflow = 'hidden';
      aboutModal.classList.add('active');
    });
  }

  if (closeAboutModal) {
    closeAboutModal.addEventListener('click', () => {
      document.body.style.overflow = 'auto';
      aboutModal.classList.remove('active');
    });
  }

  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        document.body.style.overflow = 'auto';
        aboutModal.classList.remove('active');
      }
    });
  }

  // Image Lightbox Logic
  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const fullscreenImage = document.getElementById('fullscreenImage');

  if (closeImageModal) {
    closeImageModal.addEventListener('click', () => {
      imageModal.classList.remove('active');
    });
  }

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        imageModal.classList.remove('active');
      }
    });
  }

  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.slider-logo, .slider-arrow, .dot, .close-modal, .share-btn, .share-menu')) return;

    if (e.target.classList.contains('modal-header-img')) {
      if (fullscreenImage && imageModal) {
        fullscreenImage.src = e.target.src;
        imageModal.classList.add('active');
      }
      return;
    }

    const trigger = e.target.closest('.view-btn, .slide-btn, .recipe-card, .slide');
    if (trigger) {
      const id = parseInt(trigger.getAttribute('data-id'));
      const recipe = recipes.find(r => r.id === id || r.id == id);
      if (recipe) openModal(recipe);
    }
  });

  // Deep Linking & Share Logic
  const shareBtn = document.getElementById('shareBtn');
  const shareMenu = document.getElementById('shareMenu');
  const shareWhatsapp = document.getElementById('shareWhatsapp');
  const shareEmail = document.getElementById('shareEmail');
  const shareCopy = document.getElementById('shareCopy');

  if (shareBtn && shareMenu) {
    shareBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      shareMenu.classList.toggle('active');
    });
    document.addEventListener('click', (e) => {
      if (!shareMenu.contains(e.target) && !shareBtn.contains(e.target)) {
        shareMenu.classList.remove('active');
      }
    });
  }

  if (shareWhatsapp) {
    shareWhatsapp.addEventListener('click', () => {
      if (!currentRecipeForShare) return;
      const url = window.location.href;
      const text = `¡Mira esta increíble receta de ${currentRecipeForShare.title}! 🍽️\n${url}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
      shareMenu.classList.remove('active');
    });
  }

  if (shareEmail) {
    shareEmail.addEventListener('click', () => {
      if (!currentRecipeForShare) return;
      const url = window.location.href;
      const subject = `Receta: ${currentRecipeForShare.title}`;
      const body = `Hola,\n\nTe comparto esta deliciosa receta de ROLA: ${currentRecipeForShare.title}\n\nPuedes verla aquí:\n${url}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      shareMenu.classList.remove('active');
    });
  }

  if (shareCopy) {
    shareCopy.addEventListener('click', () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
        const originalText = shareCopy.innerHTML;
        shareCopy.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg> ¡Copiado!';
        setTimeout(() => {
          shareCopy.innerHTML = originalText;
          shareMenu.classList.remove('active');
        }, 2000);
      });
    });
  }

  // Handle URL on load
  const urlParams = new URLSearchParams(window.location.search);
  const recipeIdParam = urlParams.get('id');
  if (recipeIdParam) {
    const id = parseInt(recipeIdParam);
    const recipe = recipes.find(r => r.id === id || r.id == id);
    if (recipe) {
      setTimeout(() => openModal(recipe), 100);
    }
  }
});
