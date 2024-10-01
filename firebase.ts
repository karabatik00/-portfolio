// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAdhNqLp5sxOYkWW8d37qR05Wai53xDDM0",
  authDomain: "yorumlar-fa0fa.firebaseapp.com",
  projectId: "yorumlar-fa0fa",
  storageBucket: "yorumlar-fa0fa.appspot.com",
  messagingSenderId: "613353280786",
  appId: "1:613353280786:web:ab8d5b37d9d203121f0fcb",
  measurementId: "G-SWZPTTK5LB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);