import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

let auth = null;
let db = null;

if (hasFirebaseConfig) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const scopedCollection = (uid, name) => collection(db, "users", uid, name);
const scopedDoc = (uid, name, id) => doc(db, "users", uid, name, id);

export const firebaseService = {
  enabled: hasFirebaseConfig,

  onAuth(callback) {
    if (!auth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(auth, callback);
  },

  login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  },

  signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  logout() {
    return signOut(auth);
  },

  watchCollection(uid, name, callback) {
    const q = query(scopedCollection(uid, name), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
    });
  },

  watchDoc(uid, name, id, callback) {
    return onSnapshot(scopedDoc(uid, name, id), (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    });
  },

  add(uid, name, value) {
    return addDoc(scopedCollection(uid, name), {
      ...value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  set(uid, name, id, value) {
    return setDoc(
      scopedDoc(uid, name, id),
      { ...value, updatedAt: serverTimestamp() },
      { merge: true }
    );
  },

  update(uid, name, id, value) {
    return updateDoc(scopedDoc(uid, name, id), {
      ...value,
      updatedAt: serverTimestamp()
    });
  },

  remove(uid, name, id) {
    return deleteDoc(scopedDoc(uid, name, id));
  }
};
