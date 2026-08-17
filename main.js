import { recipes } from './data/recipes.js';

document.addEventListener('DOMContentLoaded', () => {
  // Slider Logic
  const sliderContainer = document.getElementById('sliderContainer');
  const sliderDots = document.getElementById('sliderDots');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  
  // Extraer las últimas 3 recetas
  const sliderRecipes = recipes.slice(0, 3);
  let currentSlide = 0;
  let autoplayInterval;

  const initSlider = () => {
    // Generate slides and dots
    sliderRecipes.forEach((recipe, index) => {
      // Create slide
      const slide = document.createElement('div');
      slide.className = `slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" class="slide-bg">
        <div class="slide-overlay"></div>
        <div class="slide-content">
          <span class="slide-tag">Nuevo</span>
          <h2 class="slide-title">${recipe.title}</h2>
          <p class="slide-desc">${recipe.description}</p>
          <button class="slide-btn">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
            Ver Receta
          </button>
        </div>
      `;
      sliderContainer.appendChild(slide);

      // Create dot
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
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
    
    resetAutoplay();
  };

  const nextSlide = () => {
    let nextIndex = (currentSlide + 1) % sliderRecipes.length;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    let prevIndex = (currentSlide - 1 + sliderRecipes.length) % sliderRecipes.length;
    goToSlide(prevIndex);
  };

  const startAutoplay = () => {
    autoplayInterval = setInterval(nextSlide, 5000); // 5 segundos
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
  const recipeGrid = document.getElementById('recipeGrid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('searchInput');

  // Función para renderizar tarjetas
  const renderRecipes = (recipesToRender) => {
    recipeGrid.innerHTML = '';
    
    if (recipesToRender.length === 0) {
      recipeGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); font-size: 1.2rem;">No se encontraron recetas.</p>';
      return;
    }

    recipesToRender.forEach((recipe, index) => {
      // Create card element
      const card = document.createElement('article');
      card.className = 'recipe-card';
      // Slight staggered animation
      card.style.animationDelay = `${index * 0.1}s`;
      
      // SVG icons
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
          <button class="view-btn">Ver Receta</button>
        </div>
      `;
      
      recipeGrid.appendChild(card);
    });
  };

  // Render inicial
  renderRecipes(recipes);

  // Funcionalidad de filtros por categoría
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar estado activo
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

  // Funcionalidad de búsqueda
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Resetear filtros visualmente cuando se busca
    filterBtns.forEach(b => b.classList.remove('active'));
    filterBtns[0].classList.add('active'); // Seleccionar 'Todas'

    const filtered = recipes.filter(r => 
      r.title.toLowerCase().includes(searchTerm) || 
      r.description.toLowerCase().includes(searchTerm)
    );
    
    renderRecipes(filtered);
  });
});
