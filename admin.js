const GITHUB_OWNER = 'roberben';
const GITHUB_REPO = 'recetas-web';
const RECIPES_PATH = 'data/recipes.json';
const CATS_PATH = 'data/categories.json';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  
  const recipeForm = document.getElementById('recipeForm');
  const formFeedback = document.getElementById('formFeedback');
  const recipeListContainer = document.getElementById('recipeListContainer');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const formTitle = document.getElementById('formTitle');
  const recipeCategoriesContainer = document.getElementById('recipeCategoriesContainer');
  
  const categoryListContainer = document.getElementById('categoryListContainer');
  const newCategoryInput = document.getElementById('newCategoryInput');
  const addCategoryBtn = document.getElementById('addCategoryBtn');

  const imagePreviewContainer = document.getElementById('imagePreviewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const recipeImageFile = document.getElementById('recipeImageFile');
  const recipeImageUrl = document.getElementById('recipeImageUrl');

  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminCategoryFilter = document.getElementById('adminCategoryFilter');

  let githubToken = localStorage.getItem('gh_token');
  let currentRecipes = [];
  let currentCategories = [];
  let recipesSha = '';
  let categoriesSha = '';

  const getAdminImageUrl = (imagePath) => {
    if (imagePath && imagePath.startsWith('./images/')) {
      return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/public/images/${imagePath.replace('./images/', '')}`;
    }
    return imagePath;
  };

  const checkAuth = async () => {
    if (githubToken) {
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        if (res.ok) {
          loginSection.classList.remove('active');
          dashboardSection.style.display = 'block';
          loadData();
          return;
        }
      } catch (e) {}
    }
    loginSection.classList.add('active');
    dashboardSection.style.display = 'none';
    localStorage.removeItem('gh_token');
  };

  checkAuth();

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    githubToken = document.getElementById('githubToken').value.trim();
    localStorage.setItem('gh_token', githubToken);
    checkAuth();
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('gh_token');
    githubToken = null;
    checkAuth();
  });

  const updateJsonFileWithRetry = async (path, message, modifierFn, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?t=${Date.now()}`, {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        if (!res.ok) throw new Error("No se pudo obtener el archivo más reciente para " + path);
        
        const fileData = await res.json();
        const latestSha = fileData.sha;
        const currentData = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        
        const newData = modifierFn(currentData);
        
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(newData, null, 2))));
        const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            content: encoded,
            sha: latestSha
          })
        });

        if (updateRes.status === 409) {
          retries++;
          console.warn(`Conflicto 409 detectado (intento ${retries}). Sincronizando y reintentando...`);
          await new Promise(r => setTimeout(r, 500 * retries));
          continue;
        }

        if (!updateRes.ok) throw new Error("Fallo al hacer commit a GitHub en " + path);
        
        const updateData = await updateRes.json();
        return { newData, newSha: updateData.content.sha };
      } catch (err) {
        if (retries >= maxRetries - 1) throw err;
        retries++;
        console.warn(`Error de red al guardar, reintentando... (${retries})`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error("Sincronización fallida tras varios intentos. Recarga la página y vuelve a intentarlo.");
  };

  // --- DATA LOADING ---
  const loadData = async () => {
    recipeListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Cargando recetas...</p>';
    categoryListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Cargando categorías...</p>';
    
    try {
      // Fetch Recipes
      const resRecipes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${RECIPES_PATH}?t=${Date.now()}`, {
        headers: { 'Authorization': `token ${githubToken}` }
      });
      if (resRecipes.ok) {
        const fileData = await resRecipes.json();
        recipesSha = fileData.sha;
        currentRecipes = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        renderRecipeList();
      }

      // Fetch Categories
      const resCats = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${CATS_PATH}?t=${Date.now()}`, {
        headers: { 'Authorization': `token ${githubToken}` }
      });
      if (resCats.ok) {
        const fileData = await resCats.json();
        categoriesSha = fileData.sha;
        currentCategories = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        renderCategoryList();
        populateCategorySelect();
      }

    } catch (error) {
      console.error(error);
      alert("Error al cargar los datos desde GitHub.");
    }
  };

  // --- CATEGORIES LOGIC ---
  const populateCategorySelect = () => {
    recipeCategoriesContainer.innerHTML = '';
    
    adminCategoryFilter.innerHTML = '<option value="all">Todas</option>';

    currentCategories.forEach(cat => {
      // For the form checkboxes
      const label = document.createElement('label');
      label.className = 'checkbox-label';
      label.innerHTML = `
        <input type="checkbox" name="recipeCategories" value="${cat}">
        ${cat}
      `;
      recipeCategoriesContainer.appendChild(label);
      
      // For the list filter dropdown
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      adminCategoryFilter.appendChild(opt);
    });
  };

  const renderCategoryList = () => {
    categoryListContainer.innerHTML = '';
    if (currentCategories.length === 0) {
      categoryListContainer.innerHTML = '<p style="color: var(--text-secondary);">No hay categorías.</p>';
      return;
    }

    currentCategories.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'admin-recipe-card';
      card.style.padding = '0.8rem 1rem';
      card.innerHTML = `
        <h4 style="text-transform: capitalize;">${cat}</h4>
        <button class="btn-icon delete cat-delete" data-cat="${cat}" title="Eliminar">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      `;
      categoryListContainer.appendChild(card);
    });

    document.querySelectorAll('.cat-delete').forEach(btn => {
      btn.addEventListener('click', (e) => deleteCategory(e.currentTarget.getAttribute('data-cat')));
    });
  };

  addCategoryBtn.addEventListener('click', async () => {
    const newCat = newCategoryInput.value.trim().toLowerCase();
    if (!newCat) return;
    if (currentCategories.includes(newCat)) {
      alert("La categoría ya existe.");
      return;
    }

    addCategoryBtn.textContent = '...';
    addCategoryBtn.disabled = true;

    try {
      const { newData, newSha } = await updateJsonFileWithRetry(
        CATS_PATH,
        `Añadir categoría: ${newCat}`,
        (latestData) => [...latestData, newCat]
      );
      
      categoriesSha = newSha;
      currentCategories = newData;
      
      newCategoryInput.value = '';
      renderCategoryList();
      populateCategorySelect();
    } catch (err) {
      alert("Error al añadir categoría: " + err.message);
    } finally {
      addCategoryBtn.textContent = 'Añadir';
      addCategoryBtn.disabled = false;
    }
  });

  const deleteCategory = async (cat) => {
    const confirmDelete = confirm(`¿Borrar la categoría "${cat}"? Las recetas que usen esta categoría seguirán existiendo.`);
    if (!confirmDelete) return;

    try {
      const { newData, newSha } = await updateJsonFileWithRetry(
        CATS_PATH,
        `Borrar categoría: ${cat}`,
        (latestData) => latestData.filter(c => c !== cat)
      );
      
      categoriesSha = newSha;
      currentCategories = newData;
      renderCategoryList();
      populateCategorySelect();
    } catch (err) {
      alert("Error al eliminar categoría: " + err.message);
    }
  };

  // --- IMAGE PREVIEW LOGIC ---
  const updateImagePreview = (src) => {
    if (src) {
      imagePreview.src = src;
      imagePreviewContainer.style.display = 'block';
    } else {
      imagePreview.src = '';
      imagePreviewContainer.style.display = 'none';
    }
  };

  recipeImageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => updateImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      updateImagePreview(getAdminImageUrl(recipeImageUrl.value || document.getElementById('existingImage').value));
    }
  });

  recipeImageUrl.addEventListener('input', (e) => {
    if (recipeImageFile.files.length === 0) {
      updateImagePreview(getAdminImageUrl(e.target.value || document.getElementById('existingImage').value));
    }
  });

  // --- RECIPES LOGIC ---
  const renderRecipeList = () => {
    recipeListContainer.innerHTML = '';
    
    const searchTerm = adminSearchInput.value.toLowerCase();
    const filterCat = adminCategoryFilter.value;

    const filteredRecipes = currentRecipes.filter(recipe => {
      const matchesSearch = recipe.title.toLowerCase().includes(searchTerm) || (recipe.description && recipe.description.toLowerCase().includes(searchTerm));
      
      let matchesCat = true;
      if (filterCat !== 'all') {
        if (Array.isArray(recipe.category)) {
          matchesCat = recipe.category.includes(filterCat);
        } else {
          matchesCat = recipe.category === filterCat;
        }
      }
      return matchesSearch && matchesCat;
    });

    if (filteredRecipes.length === 0) {
      recipeListContainer.innerHTML = '<p style="color: var(--text-secondary);">No se encontraron recetas.</p>';
      return;
    }

    filteredRecipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'admin-recipe-card';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap: 10px;">
          <img src="${getAdminImageUrl(recipe.image)}" style="width: 40px; height: 40px; border-radius: 5px; object-fit: cover;">
          <h4>${recipe.title}</h4>
        </div>
        <div class="admin-recipe-actions">
          <button class="btn-icon edit" data-id="${recipe.id}" title="Editar">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="btn-icon delete" data-id="${recipe.id}" title="Eliminar">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;
      recipeListContainer.appendChild(card);
    });

    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
      btn.addEventListener('click', (e) => editRecipe(e.currentTarget.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
      btn.addEventListener('click', (e) => deleteRecipe(e.currentTarget.getAttribute('data-id')));
    });
  };

  adminSearchInput.addEventListener('input', renderRecipeList);
  adminCategoryFilter.addEventListener('change', renderRecipeList);

  const editRecipe = (id) => {
    const recipe = currentRecipes.find(r => r.id == id);
    if (!recipe) return;

    document.getElementById('recipeId').value = recipe.id;
    document.getElementById('recipeTitle').value = recipe.title;
    
    const catCheckboxes = document.querySelectorAll('input[name="recipeCategories"]');
    catCheckboxes.forEach(cb => {
      if (Array.isArray(recipe.category)) {
        cb.checked = recipe.category.includes(cb.value);
      } else {
        cb.checked = (recipe.category === cb.value);
      }
    });

    document.getElementById('recipeTime').value = recipe.time;
    document.getElementById('recipeDifficulty').value = recipe.difficulty;
    document.getElementById('recipeDescription').value = recipe.description;
    document.getElementById('existingImage').value = recipe.image;
    document.getElementById('recipeImageUrl').value = recipe.image;
    updateImagePreview(getAdminImageUrl(recipe.image));
    const formatForEditor = (data, isOrdered = false) => {
      if (Array.isArray(data)) {
        return data.map((item, index) => isOrdered ? `${index + 1}. ${item}` : `- ${item}`).join('\n');
      }
      return data || '';
    };

    document.getElementById('recipeIngredients').value = formatForEditor(recipe.ingredients, false);
    document.getElementById('recipeInstructions').value = formatForEditor(recipe.instructions, true);

    document.getElementById('imageHint').textContent = "(Dejar vacío para conservar la actual)";
    
    formTitle.textContent = "Editar Receta";
    document.getElementById('saveRecipeBtn').textContent = "Guardar Cambios";
    cancelEditBtn.style.display = 'block';
  };

  const resetForm = () => {
    recipeForm.reset();
    document.getElementById('recipeId').value = '';
    document.getElementById('existingImage').value = '';
    document.getElementById('imageHint').textContent = "";
    updateImagePreview('');
    formTitle.textContent = "Añadir Nueva Receta";
    document.getElementById('saveRecipeBtn').textContent = "Publicar en GitHub";
    cancelEditBtn.style.display = 'none';
  };

  cancelEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });

  const deleteRecipe = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar esta receta?");
    if (!confirmDelete) return;

    try {
      const { newData, newSha } = await updateJsonFileWithRetry(
        RECIPES_PATH,
        `Borrar receta ${id}`,
        (latestData) => latestData.filter(r => r.id != id)
      );
      
      recipesSha = newSha;
      currentRecipes = newData;
      renderRecipeList();
      alert("Receta eliminada correctamente.");
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('saveRecipeBtn');
    submitBtn.disabled = true;
    formFeedback.textContent = '';
    
    const editingId = document.getElementById('recipeId').value;
    const isEditing = editingId !== '';

    try {
      let finalImageUrl = document.getElementById('recipeImageUrl').value;
      const fileInput = document.getElementById('recipeImageFile');
      const existingImage = document.getElementById('existingImage').value;

      if (fileInput.files.length > 0) {
        formFeedback.textContent = 'Subiendo imagen...';
        const file = fileInput.files[0];
        const base64Data = await fileToBase64(file);
        const fileName = `recipe_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const imagePath = `public/images/${fileName}`;
        
        const imgRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${imagePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Upload image: ${fileName}`,
            content: base64Data
          })
        });

        if (!imgRes.ok) throw new Error("No se pudo subir la imagen.");
        finalImageUrl = `./images/${fileName}`;
      } else if (isEditing && !finalImageUrl) {
        finalImageUrl = existingImage;
      }

      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      }
      
      const selectedCats = Array.from(document.querySelectorAll('input[name="recipeCategories"]:checked')).map(cb => cb.value);
      if (selectedCats.length === 0) {
        document.getElementById('categoryError').style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = isEditing ? 'Guardar Cambios' : 'Publicar en GitHub';
        return;
      }
      document.getElementById('categoryError').style.display = 'none';

      formFeedback.textContent = 'Guardando en la base de datos...';
      
      const newRecipeData = {
        id: isEditing ? parseInt(editingId) : Date.now(),
        title: document.getElementById('recipeTitle').value,
        category: selectedCats,
        time: document.getElementById('recipeTime').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        description: document.getElementById('recipeDescription').value,
        image: finalImageUrl,
        ingredients: document.getElementById('recipeIngredients').value,
        instructions: document.getElementById('recipeInstructions').value
      };

      const { newData, newSha } = await updateJsonFileWithRetry(
        RECIPES_PATH,
        isEditing ? `Editar receta: ${newRecipeData.title}` : `Añadir receta: ${newRecipeData.title}`,
        (latestData) => {
          if (isEditing) {
            return latestData.map(r => r.id == editingId ? newRecipeData : r);
          } else {
            return [newRecipeData, ...latestData];
          }
        }
      );
      
      recipesSha = newSha;
      currentRecipes = newData;
      
      formFeedback.textContent = isEditing ? "¡Cambios guardados con éxito!" : "¡Receta publicada con éxito!";
      formFeedback.style.color = "#10b981";
      resetForm();
      renderRecipeList();
      
      setTimeout(() => formFeedback.textContent = '', 4000);
    } catch (error) {
      console.error(error);
      formFeedback.textContent = "Error: " + error.message;
      formFeedback.style.color = "#ef4444";
    } finally {
      submitBtn.disabled = false;
    }
  });
});
