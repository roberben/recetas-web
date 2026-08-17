import { auth, db, storage } from './src/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { recipes as initialData } from './data/recipes.js';

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const recipeForm = document.getElementById('recipeForm');
  const seedBtn = document.getElementById('seedBtn');
  const formFeedback = document.getElementById('formFeedback');

  // Auth State Observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginSection.classList.remove('active');
      dashboardSection.classList.add('active');
    } else {
      loginSection.classList.add('active');
      dashboardSection.classList.remove('active');
    }
  });

  // Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    try {
      const btn = loginForm.querySelector('button');
      btn.textContent = 'Verificando...';
      await signInWithEmailAndPassword(auth, email, password);
      errorMsg.textContent = '';
      btn.textContent = 'Ingresar';
    } catch (error) {
      errorMsg.textContent = "Error: Credenciales inválidas.";
      loginForm.querySelector('button').textContent = 'Ingresar';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    signOut(auth);
  });

  // Handle Recipe Submit
  recipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('saveRecipeBtn');
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;

    try {
      let finalImageUrl = document.getElementById('recipeImageUrl').value;
      const fileInput = document.getElementById('recipeImageFile');

      // Si subió un archivo, lo subimos a Storage primero
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const storageRef = ref(storage, `recipes/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      // Si no hay imagen, usar placeholder
      if (!finalImageUrl) {
        finalImageUrl = "https://images.unsplash.com/photo-1495195134817-aeb325a55b65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
      }

      const newRecipe = {
        title: document.getElementById('recipeTitle').value,
        category: document.getElementById('recipeCategory').value,
        time: document.getElementById('recipeTime').value,
        difficulty: document.getElementById('recipeDifficulty').value,
        description: document.getElementById('recipeDescription').value,
        image: finalImageUrl,
        ingredients: document.getElementById('recipeIngredients').value.split('\n').filter(i => i.trim() !== ''),
        instructions: document.getElementById('recipeInstructions').value.split('\n').filter(i => i.trim() !== ''),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "recipes"), newRecipe);
      
      formFeedback.textContent = "¡Receta guardada exitosamente en la nube!";
      formFeedback.style.color = "#10b981";
      recipeForm.reset();
      
      setTimeout(() => formFeedback.textContent = '', 4000);
    } catch (error) {
      console.error(error);
      formFeedback.textContent = "Error al guardar: " + error.message;
      formFeedback.style.color = "#ef4444";
    } finally {
      submitBtn.textContent = 'Guardar Receta en la Nube';
      submitBtn.disabled = false;
    }
  });

  // Seed Initial Data
  seedBtn.addEventListener('click', async () => {
    const confirmSeed = confirm("Esto copiará las recetas locales a la nube. ¿Continuar?");
    if (confirmSeed) {
      seedBtn.textContent = 'Subiendo...';
      seedBtn.disabled = true;
      try {
        for (const recipe of initialData) {
          const r = {...recipe, createdAt: serverTimestamp()};
          delete r.id; 
          await addDoc(collection(db, "recipes"), r);
        }
        alert("Datos iniciales migrados exitosamente");
        seedBtn.style.display = 'none';
      } catch (error) {
        console.error("Error seeding", error);
        alert("Error al migrar datos: " + error.message);
        seedBtn.textContent = 'Intentar de nuevo';
        seedBtn.disabled = false;
      }
    }
  });
});
