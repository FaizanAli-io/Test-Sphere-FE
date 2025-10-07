import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_rlIQs8Je0EJSMeg4OZ59XrQCgZl_JyE",
  authDomain: "testsphere-1312e.firebaseapp.com",
  projectId: "testsphere-1312e",
  storageBucket: "testsphere-1312e.firebasestorage.app",
  messagingSenderId: "104923962249",
  appId: "1:104923962249:web:f0c521ab72017e03a21f58",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
