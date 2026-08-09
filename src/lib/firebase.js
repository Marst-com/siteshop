import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpjenLqwryCYRUME2qwQ6McKzhXRTVVi8",
  authDomain: "duomarstsiteshop.firebaseapp.com",
  projectId: "duomarstsiteshop",
  storageBucket: "duomarstsiteshop.firebasestorage.app",
  messagingSenderId: "325636946632",
  appId: "1:325636946632:web:5834d6c7ece104256bc3fd",
  measurementId: "G-V0P46491JG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
