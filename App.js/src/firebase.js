// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAPMTPjNU0Pr-h54hqkPL9PRYPwKy1gLC8",
  authDomain: "collegedeciderapp.firebaseapp.com",
  projectId: "collegedeciderapp",
  storageBucket: "collegedeciderapp.firebasestorage.app",
  messagingSenderId: "595343369892",
  appId: "1:595343369892:web:b5ec1c74d7c5a9a53ea831",
  measurementId: "G-P8EJV8MVF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);