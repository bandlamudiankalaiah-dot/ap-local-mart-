import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminDb = getFirestore(firebaseConfig.firestoreDatabaseId);

export async function saveEntityToFirestore(collectionName: string, id: string, data: Record<string, any>) {
  try {
    const clean = JSON.parse(JSON.stringify(data));
    await adminDb.collection(collectionName).doc(id).set(clean, { merge: true });
  } catch (err) {
    // Non-blocking fallback so in-memory cache stays responsive if admin credentials aren't bound
  }
}

export async function deleteEntityFromFirestore(collectionName: string, id: string) {
  try {
    await adminDb.collection(collectionName).doc(id).delete();
  } catch (err) {
    // Non-blocking fallback
  }
}

export async function loadCollectionFromFirestore<T>(collectionName: string): Promise<T[] | null> {
  try {
    const snap = await adminDb.collection(collectionName).get();
    if (snap.empty) return null;
    return snap.docs.map(d => d.data() as T);
  } catch (err) {
    return null;
  }
}
