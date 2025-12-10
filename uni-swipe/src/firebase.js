// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
  measurementId: "G-P8EJV8MVF4" // not used, but fine to keep in config
};

let app;

// Make sure we don't initialize Firebase more than once
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Export these for use in the rest of the app
export const auth = getAuth(app);
export const db = getFirestore(app);