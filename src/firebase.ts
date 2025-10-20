// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDqCUZGdgA8sh0WiakwpW7gBVhj9F4CHes",
    authDomain: "metaversugoroku.firebaseapp.com",
    projectId: "metaversugoroku",
    storageBucket: "metaversugoroku.firebasestorage.app",
    messagingSenderId: "198970298729",
    appId: "1:198970298729:web:10bbc12c8b8bb4416fedf8",
    measurementId: "G-R64LX4N9RX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);