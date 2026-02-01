import { initializeApp } from "firebase/app";

import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAQviM1eXExx7OBOA6jYbp6hj2gz5jWvgw",
    authDomain: "discoursify.firebaseapp.com",
    projectId: "discoursify",
    storageBucket: "discoursify.firebasestorage.app",
    messagingSenderId: "470277451434",
    appId: "1:470277451434:web:130479314145d967dfead3",
    measurementId: "G-JFM8XFL2SD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
