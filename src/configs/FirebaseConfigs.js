// FirebaseConfigs.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAOWBDeIEkVGNcdT6CyFy0LxYHbQk9pNJ0",
  authDomain: "businessdirectory-gobiz.firebaseapp.com",
  projectId: "businessdirectory-gobiz",
  storageBucket: "businessdirectory-gobiz.firebasestorage.app",
  messagingSenderId: "372498056131",
  appId: "1:372498056131:web:c6b1824fce20af3101b376"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;