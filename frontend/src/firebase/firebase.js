import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBSIuddlcYzJH14b7qc2Pzz8EN7Tizj0t4",
  authDomain: "neopos--auth.firebaseapp.com",
  projectId: "neopos--auth",
  storageBucket: "neopos--auth.firebasestorage.app",
  messagingSenderId: "229092865466",
  appId: "1:229092865466:web:7e09a0d004002b1c7fd983",
  measurementId: "G-4ZT6MGR7KZ" //only use if you have analytics enabled
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
