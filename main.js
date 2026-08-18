import recipes from './data/recipes.json';

document.addEventListener('DOMContentLoaded', () => {
  const sliderContainer = document.getElementById('sliderContainer');
  const sliderDots = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const recipeGrid = document.getElementById('recipeGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');
  const recipeModal = document.getElementById('recipeModal');
  const closeModalBtn = document.getElementById('closeModal');
  const modalBody = document.getElementById('modalBody');

  let currentSlide = 0;
  let autoplayInterval;
  const sliderRecipes = recipes.slice(0, 3);

  // Slider Logic
  const initSlider = () => {
    if (sliderRecipes.length === 0) return;
    
    sliderContainer.innerHTML = '';
    sliderDots.innerHTML = '';

    sliderRecipes.forEach((recipe, index) => {
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" class="slide-bg">
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <span class="slide-tag">Nuevo</span>
          <h2 class="slide-title">${recipe.title}</h2>
          <p class="slide-desc">${recipe.description}</p>
          <button class="slide-btn" data-id="${recipe.id}">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
            Ver Receta
          </button>
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
    if(sliderRecipes.length > 1) {
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
      
      const timeIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
      const diffIcon = `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;

      card.innerHTML = `
        <div class="recipe-img-container">
          <span class="recipe-category">${recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}</span>
          <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img" loading="lazy">
        </div>
        <div class="recipe-content">
          <h3 class="recipe-title">${recipe.title}</h3>
          <div class="recipe-meta">
            <span>${timeIcon} ${recipe.time}</span>
            <span>${diffIcon} ${recipe.difficulty}</span>
          </div>
          <p class="recipe-desc">${recipe.description}</p>
          <button class="view-btn" data-id="${recipe.id}">Ver Receta</button>
        </div>
      `;
      recipeGrid.appendChild(card);
    });
  };

  renderRecipes(recipes);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-category');
      
      if (category === 'all') {
        renderRecipes(recipes);
      } else {
        const filtered = recipes.filter(r => r.category === category);
        renderRecipes(filtered);
      }
    });
  });

  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filterBtns.forEach(b => b.classList.remove('active'));
    filterBtns[0].classList.add('active'); 
    const filtered = recipes.filter(r => 
      r.title.toLowerCase().includes(searchTerm) || 
      r.description.toLowerCase().includes(searchTerm)
    );
    renderRecipes(filtered);
  });

  // Modal Logic
  const openModal = (recipe) => {
    const timeIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>`;
    const diffIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>`;

    const ingredientsHtml = (recipe.ingredients || []).map(ing => `<li>${ing}</li>`).join('');
    const instructionsHtml = (recipe.instructions || []).map(inst => `<li>${inst}</li>`).join('');

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
        <ul class="modal-list">
          ${ingredientsHtml}
        </ul>
        
        <h3 class="modal-section-title">Instrucciones</h3>
        <ol class="modal-list steps">
          ${instructionsHtml}
        </ol>
      </div>
    `;
    document.body.style.overflow = 'hidden'; 
    recipeModal.classList.add('active');
  };

  const closeModal = () => {
    document.body.style.overflow = 'auto'; 
    recipeModal.classList.remove('active');
  };

  closeModalBtn.addEventListener('click', closeModal);
  recipeModal.addEventListener('click', (e) => {
    if (e.target === recipeModal) closeModal();
  });

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-btn, .slide-btn');
    if (btn) {
      const id = parseInt(btn.getAttribute('data-id'));
      const recipe = recipes.find(r => r.id === id || r.id == id);
      if (recipe) openModal(recipe);
    }
  });
});
