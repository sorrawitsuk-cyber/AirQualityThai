import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDQVebX5jO-iE2RB8bBVQMkQ8ETd7oZfoc',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'thai-env-dashboard.firebaseapp.com',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || 'https://thai-env-dashboard-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'thai-env-dashboard',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'thai-env-dashboard.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '124321790987',
  appId: env.VITE_FIREBASE_APP_ID || '1:124321790987:web:7d2a66971e146cc13a1b0e',
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
