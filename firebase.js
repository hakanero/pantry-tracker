// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: "AIzaSyAhOqS-_4u36WOo4MZptXvx810P5211qOQ",
	authDomain: "pantry-tracker-headstarter.firebaseapp.com",
	projectId: "pantry-tracker-headstarter",
	storageBucket: "pantry-tracker-headstarter.appspot.com",
	messagingSenderId: "806036504550",
	appId: "1:806036504550:web:9ce35ba92617a765c16027",
	measurementId: "G-6TDQM46BQB"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export { firestore };