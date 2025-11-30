// Your web app's Firebase configuration
const firebaseConfig = {
  // Your actual config details
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase App using the global 'firebase' object (V8 Syntax)
const app = firebase.initializeApp(firebaseConfig);

// Initialize Services using the V8 Namespace and make them GLOBAL
const auth = firebase.auth();           
const db = firebase.firestore();
