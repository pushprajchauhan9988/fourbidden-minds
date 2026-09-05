import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";


import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    getDocs,
    setDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";



/* ==========================================
   FIREBASE CONFIG
========================================== */

const firebaseConfig = {

    apiKey: "AIzaSyBcU-9Ttk3FAOEy_PURgPO7JH__uM7MPww",

    authDomain: "rent-stud.firebaseapp.com",

    projectId: "rent-stud",

    storageBucket: "rent-stud.firebasestorage.app",

    messagingSenderId: "527681880107",

    appId: "1:527681880107:web:598c7150320be5518eea6"

};



/* ==========================================
   INITIALIZE FIREBASE
========================================== */

const firebaseApp =
    initializeApp(firebaseConfig);


const auth =
    getAuth(firebaseApp);


const db =
    getFirestore(firebaseApp);


const storage =
    getStorage(firebaseApp);


const googleProvider =
    new GoogleAuthProvider();



/* ==========================================
   EXPORT EVERYTHING
========================================== */

export {

    firebaseApp,

    auth,

    db,

    storage,

    googleProvider,

    signInWithPopup,

    signOut,

    onAuthStateChanged,

    collection,

    doc,

    getDoc,

    setDoc,

    addDoc,

    updateDoc,

    query,

    where,

    orderBy,

    onSnapshot,

    serverTimestamp,

    ref,

    uploadBytes,

    getDownloadURL

};