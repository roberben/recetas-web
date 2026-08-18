const GITHUB_OWNER = 'roberben';
const GITHUB_REPO = 'recetas-web';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const recipeForm = document.getElementById('recipeForm');
  const formFeedback = document.getElementById('formFeedback');

  let githubToken = localStorage.getItem('gh_token');

  const checkAuth = async () => {
    if (githubToken) {
      // Validate token
      try {
        const res = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${githubToken}` }
        });
        if (res.ok) {
          loginSection.classList.remove('active');
          dashboardSection.classList.add('active');
          return;
        }
      } catch (e) {}
    }
    // Fail
    loginSection.classList.add('active');
    dashboardSection.classList.remove('active');
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

  // Base64 helper for file upload
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
    submitBtn.textContent = 'Subiendo a GitHub...';
    submitBtn.disabled = true;
    formFeedback.textContent = '';

    try {
      let finalImageUrl = document.getElementById('recipeImageUrl').value;
      const fileInput = document.getElementById('recipeImageFile');

      // 1. Upload image to GitHub if file provided
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

        if (!imgRes.ok) throw new Error("No se pudo subir la imagen a GitHub.");
        
        // La URL pública de la imagen en Vite public folder es /images/filename.jpg
        finalImageUrl = `/images/${fileName}`;
      }

      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      }

      formFeedback.textContent = 'Generando receta...';
      
      const newRecipe = {
        id: Date.now(), // Generate a unique ID
        title: document.getElementById('recipeTitle').value,
        category: document.getElementById('recipeCategory').value,
        time: document.getElementById('recipeTime').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        description: document.getElementById('recipeDescription').value,
        image: finalImageUrl,
        ingredients: document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim() !== ''),
        instructions: document.getElementById('recipeInstructions').value.split('\n').filter(i => i.trim() !== '')
      };

      // 2. Fetch current data/recipes.js
      formFeedback.textContent = 'Actualizando base de datos en GitHub...';
      const fileRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/recipes.js`, {
        headers: { 'Authorization': `token ${githubToken}` }
      });
      if (!fileRes.ok) throw new Error("No se pudo leer data/recipes.js");
      
      const fileData = await fileRes.json();
      const currentSha = fileData.sha;
      
      // Decode content from base64 (GitHub uses base64 for file content)
      const currentContent = decodeURIComponent(escape(atob(fileData.content)));
      
      const recipeJsonString = JSON.stringify(newRecipe, null, 2);
      const indentedRecipe = recipeJsonString.split('\n').map(line => '  ' + line).join('\n');
      
      const insertionPoint = "export const recipes = [";
      if (!currentContent.includes(insertionPoint)) throw new Error("No se encontró el arreglo recipes en el archivo.");
      
      const updatedContent = currentContent.replace(
        insertionPoint, 
        `${insertionPoint}\n${indentedRecipe},`
      );

      // Encode back to base64
      const newBase64Content = btoa(unescape(encodeURIComponent(updatedContent)));

      // 3. Commit the updated recipes.js
      formFeedback.textContent = 'Haciendo commit...';
      const updateRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/data/recipes.js`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Añadir receta: ${newRecipe.title}`,
          content: newBase64Content,
          sha: currentSha
        })
      });

      if (!updateRes.ok) throw new Error("No se pudo actualizar data/recipes.js");

      formFeedback.textContent = "¡Éxito! La web se publicará con tu nueva receta en unos instantes.";
      formFeedback.style.color = "#10b981";
      recipeForm.reset();
      
    } catch (error) {
      console.error(error);
      formFeedback.textContent = "Error: " + error.message;
      formFeedback.style.color = "#ef4444";
    } finally {
      submitBtn.textContent = 'Publicar en GitHub';
      submitBtn.disabled = false;
    }
  });
});
