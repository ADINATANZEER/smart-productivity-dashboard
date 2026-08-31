import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByIJKeaPNwoM5__NblKLXhH1QRbDt0zZ0",
    authDomain: "smart-productivity-dashb-e52f9.firebaseapp.com",
    projectId: "smart-productivity-dashb-e52f9",
    storageBucket: "smart-productivity-dashb-e52f9.firebasestorage.app",
    messagingSenderId: "685099311860",
    appId: "1:685099311860:web:549a7c996c7f7fef1b74a1"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };