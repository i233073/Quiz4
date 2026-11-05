import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBue8TocQQ4laB_LKJmSH8adxeGLBGrR9w",
    authDomain: "otpverification-7ddb9.firebaseapp.com",
    projectId: "otpverification-7ddb9",
    storageBucket: "otpverification-7ddb9.firebasestorage.app",
    messagingSenderId: "585368922781",
    appId: "1:585368922781:web:474b893c22e41696b08274"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);