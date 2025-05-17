// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMxrxtxxeePY3li8k2Dq1xgrLZas6X2VM",
  authDomain: "codehub-c039d.firebaseapp.com",
  projectId: "codehub-c039d",
  storageBucket: "codehub-c039d.firebasestorage.app",
  messagingSenderId: "641440571918",
  appId: "1:641440571918:web:ddc19788cab6b9aebed25f",
  measurementId: "G-GRK4T1735E"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Make auth and db available globally
window.auth = auth;
window.db = db; 