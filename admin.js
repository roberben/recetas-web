const GITHUB_OWNER = 'roberben';
const GITHUB_REPO = 'recetas-web';
const DB_PATH = 'data/recipes.json';

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
  
  let githubToken = localStorage.getItem('gh_token');
  let currentRecipes = [];
  let dbSha = '';

  const checkAuth = async () => {
    if (githubToken) {
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        if (res.ok) {
          loginSection.classList.remove('active');
          dashboardSection.style.display = 'flex';
          loadRecipes(); // Cargar la lista al iniciar
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

  // Fetch and display recipes
  const loadRecipes = async () => {
    recipeListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Cargando...</p>';
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DB_PATH}?t=${Date.now()}`, {
        headers: { 'Authorization': `token ${githubToken}` }
      });
      if (!res.ok) throw new Error("No se pudo leer la base de datos.");
      
      const fileData = await res.json();
      dbSha = fileData.sha;
      const content = decodeURIComponent(escape(atob(fileData.content)));
      currentRecipes = JSON.parse(content);
      
      renderRecipeList();
    } catch (error) {
      console.error(error);
      recipeListContainer.innerHTML = '<p style="color: #ef4444;">Error al cargar recetas.</p>';
    }
  };

  const renderRecipeList = () => {
    recipeListContainer.innerHTML = '';
    if (currentRecipes.length === 0) {
      recipeListContainer.innerHTML = '<p style="color: var(--text-secondary);">No hay recetas publicadas.</p>';
      return;
    }

    currentRecipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'admin-recipe-card';
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap: 10px;">
          <img src="${recipe.image}" style="width: 40px; height: 40px; border-radius: 5px; object-fit: cover;">
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

    // Attach listeners
    document.querySelectorAll('.btn-icon.edit').forEach(btn => {
      btn.addEventListener('click', (e) => editRecipe(e.currentTarget.getAttribute('data-id')));
    });
    document.querySelectorAll('.btn-icon.delete').forEach(btn => {
      btn.addEventListener('click', (e) => deleteRecipe(e.currentTarget.getAttribute('data-id')));
    });
  };

  const editRecipe = (id) => {
    const recipe = currentRecipes.find(r => r.id == id);
    if (!recipe) return;

    document.getElementById('recipeId').value = recipe.id;
    document.getElementById('recipeTitle').value = recipe.title;
    document.getElementById('recipeCategory').value = recipe.category;
    document.getElementById('recipeTime').value = recipe.time;
    document.getElementById('recipeDifficulty').value = recipe.difficulty;
    document.getElementById('recipeDescription').value = recipe.description;
    document.getElementById('existingImage').value = recipe.image;
    document.getElementById('recipeImageUrl').value = recipe.image;
    document.getElementById('recipeIngredients').value = recipe.ingredients.join('\n');
    document.getElementById('recipeInstructions').value = recipe.instructions.join('\n');

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
    formTitle.textContent = "Añadir Nueva Receta";
    document.getElementById('saveRecipeBtn').textContent = "Publicar en GitHub";
    cancelEditBtn.style.display = 'none';
  };

  cancelEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
  });

  const commitToGithub = async (message, newContent, updateSha) => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(newContent, null, 2))));
    const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DB_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        content: encoded,
        sha: updateSha
      })
    });
    if (!updateRes.ok) throw new Error("Fallo al hacer commit a GitHub");
    return await updateRes.json();
  };

  const deleteRecipe = async (id) => {
    const confirmDelete = confirm("¿Estás seguro de que quieres eliminar esta receta?");
    if (!confirmDelete) return;

    try {
      recipeListContainer.innerHTML = '<p style="text-align: center; color: var(--accent-color);">Eliminando en GitHub...</p>';
      
      const newArray = currentRecipes.filter(r => r.id != id);
      const resData = await commitToGithub(`Borrar receta ${id}`, newArray, dbSha);
      
      dbSha = resData.content.sha;
      currentRecipes = newArray;
      renderRecipeList();
      alert("Receta eliminada correctamente.");
    } catch (err) {
      alert("Error al eliminar: " + err.message);
      renderRecipeList();
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
        finalImageUrl = `/images/${fileName}`;
      } else if (isEditing && !finalImageUrl) {
        finalImageUrl = existingImage;
      }

      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      }

      formFeedback.textContent = 'Guardando en la base de datos...';
      
      const newRecipeData = {
        id: isEditing ? parseInt(editingId) : Date.now(),
        title: document.getElementById('recipeTitle').value,
        category: document.getElementById('recipeCategory').value,
        time: document.getElementById('recipeTime').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        description: document.getElementById('recipeDescription').value,
        image: finalImageUrl,
        ingredients: document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim() !== ''),
        instructions: document.getElementById('recipeInstructions').value.split('\n').filter(i => i.trim() !== '')
      };

      let newArray;
      if (isEditing) {
        newArray = currentRecipes.map(r => r.id == editingId ? newRecipeData : r);
      } else {
        newArray = [newRecipeData, ...currentRecipes];
      }

      const resData = await commitToGithub(isEditing ? `Editar receta: ${newRecipeData.title}` : `Añadir receta: ${newRecipeData.title}`, newArray, dbSha);
      
      dbSha = resData.content.sha;
      currentRecipes = newArray;
      
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
