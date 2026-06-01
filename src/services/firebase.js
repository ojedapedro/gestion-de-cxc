import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  writeBatch,
  query,
  limit
} from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase configuration is provided and valid
export const isFirebaseConfigured = () => {
  return (
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'tu_api_key_aqui' &&
    import.meta.env.VITE_FIREBASE_API_KEY.trim() !== ''
  );
};

let app = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully!");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase credentials not configured. Falling back to Local Storage mode.");
}

export { db };

/**
 * Saves/updates a single document in a collection.
 * Uses the item's custom ID as the Firestore document ID to prevent duplicates.
 */
export const saveDocument = async (collectionName, item) => {
  if (!db || !item || !item.id) return null;
  try {
    const docRef = doc(db, collectionName, String(item.id));
    await setDoc(docRef, item);
    return item.id;
  } catch (error) {
    console.error(`Error saving document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Deletes a single document from a collection by ID.
 */
export const deleteDocument = async (collectionName, id) => {
  if (!db || !id) return;
  try {
    const docRef = doc(db, collectionName, String(id));
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Performs a batch write to seed a collection if it has no documents.
 */
export const seedCollectionIfEmpty = async (collectionName, initialItems) => {
  if (!db || !initialItems || initialItems.length === 0) return false;
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`Seeding Firestore collection: "${collectionName}" with ${initialItems.length} documents...`);
      const batch = writeBatch(db);
      
      // Firestore batch write limit is 500 operations
      // We process in chunks of 400 just to be safe
      const chunks = [];
      for (let i = 0; i < initialItems.length; i += 400) {
        chunks.push(initialItems.slice(i, i + 400));
      }

      for (const chunk of chunks) {
        const subBatch = writeBatch(db);
        chunk.forEach((item) => {
          const docRef = doc(db, collectionName, String(item.id));
          subBatch.set(docRef, item);
        });
        await subBatch.commit();
      }
      console.log(`Collection "${collectionName}" successfully seeded!`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error seeding collection "${collectionName}":`, error);
    return false;
  }
};
