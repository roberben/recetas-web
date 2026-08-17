import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDw4m_1gq3avHROeIawTARsZtKULV3cuTs",
  authDomain: "recetas-web-ac14f.firebaseapp.com",
  projectId: "recetas-web-ac14f",
  storageBucket: "recetas-web-ac14f.firebasestorage.app",
  messagingSenderId: "173893747792",
  appId: "1:173893747792:web:1c21abbe2d44b55653fd55",
  measurementId: "G-P7SPH832YG"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
