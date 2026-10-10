import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { TelemetryProject } from '../types';

// Fallback config matching provisioned project
export const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || "gen-lang-client-0816544069",
  appId: firebaseConfigJson.appId || "1:1070360582917:web:8c0825fe3eb886644b356c",
  apiKey: firebaseConfigJson.apiKey || "AIzaSyB-0i9UicLefCXJmUcP2vU0-DDdOYF1nS0",
  authDomain: firebaseConfigJson.authDomain || "gen-lang-client-0816544069.firebaseapp.com",
  firestoreDatabaseId: firebaseConfigJson.firestoreDatabaseId || "ai-studio-agentpulse-0ae4b515-7567-498a-845a-fb9cb589acce",
  storageBucket: firebaseConfigJson.storageBucket || "gen-lang-client-0816544069.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "1070360582917"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export { onAuthStateChanged };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId if configured
export const db: Firestore =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

/**
 * Sync user profile to Firestore `/users/{uid}`
 */
export async function syncUserProfile(user: User) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.isAnonymous ? 'Guest Explorer' : 'Engineer'),
        photoURL: user.photoURL || '',
        isAnonymous: user.isAnonymous,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, {
        lastActiveAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

/**
 * Sign in with Google Popup with graceful fallback
 */
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign in Anonymously for fast, seamless exploration
 */
export async function signInAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign in with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Register with Email & Password
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name) {
    await updateProfile(result.user, { displayName: name });
  }
  await syncUserProfile(result.user);
  return result.user;
}

/**
 * Sign Out
 */
export async function logOut(): Promise<void> {
  clearDemoUser();
  await firebaseSignOut(auth);
}

/**
 * Safe Demo / Sandbox User fallback for presentations, testing, or unauthorized domains
 */
export function createDemoUser(
  displayName = 'Lead Systems Engineer',
  email = 'engineer@agentpulse.dev'
): User {
  const uid = 'demo-engineer-' + (typeof window !== 'undefined' ? (window.sessionStorage.getItem('agentpulse_uid') || '001') : '001');
  const demoUser = {
    uid,
    displayName,
    email,
    emailVerified: true,
    isAnonymous: false,
    phoneNumber: null,
    photoURL: null,
    providerId: 'firebase',
    refreshToken: 'demo-refresh-token',
    tenantId: null,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    },
    providerData: [],
    delete: async () => {},
    getIdToken: async () => 'demo-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({})
  } as unknown as User;

  try {
    localStorage.setItem('agentpulse_demo_user', JSON.stringify({
      uid: demoUser.uid,
      displayName: demoUser.displayName,
      email: demoUser.email,
      isAnonymous: false
    }));
  } catch {}

  return demoUser;
}

export function getSavedDemoUser(): User | null {
  try {
    const saved = localStorage.getItem('agentpulse_demo_user');
    if (saved) {
      const data = JSON.parse(saved);
      return createDemoUser(data.displayName, data.email);
    }
  } catch {}
  return null;
}

export function clearDemoUser(): void {
  try {
    localStorage.removeItem('agentpulse_demo_user');
  } catch {}
}

/**
 * Project Management in Firestore
 */
export async function createTelemetryProject(
  userId: string,
  projectData: {
    name: string;
    description?: string;
    environment: 'production' | 'staging' | 'development';
  }
): Promise<TelemetryProject> {
  const keyHash = Math.random().toString(36).substring(2, 10);
  const randomSlug = projectData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16) || 'project';
  const apiKey = `ap_live_${randomSlug}_${keyHash}`;

  const docRef = await addDoc(collection(db, 'projects'), {
    name: projectData.name,
    description: projectData.description || '',
    environment: projectData.environment,
    ownerId: userId,
    apiKey,
    createdAt: new Date().toISOString(),
    agentCount: 0,
    traceCount: 0
  });

  return {
    id: docRef.id,
    name: projectData.name,
    description: projectData.description,
    environment: projectData.environment,
    ownerId: userId,
    apiKey,
    createdAt: new Date().toISOString(),
    agentCount: 0,
    traceCount: 0
  };
}

export function subscribeToUserProjects(
  userId: string,
  callback: (projects: TelemetryProject[]) => void,
  onError?: (error: Error) => void
) {
  const defaultDemoProjects: TelemetryProject[] = [
    {
      id: 'proj_swarm_production',
      name: 'Swarm Orchestration Core',
      description: 'Primary high-throughput multi-agent orchestration runtime',
      environment: 'production',
      ownerId: userId,
      apiKey: 'ap_live_swm992810a',
      createdAt: new Date().toISOString(),
      agentCount: 14,
      traceCount: 12480
    },
    {
      id: 'proj_eval_staging',
      name: 'Agent Evaluator Labs',
      description: 'Autonomous synthetic evaluation & drift bench',
      environment: 'staging',
      ownerId: userId,
      apiKey: 'ap_test_evl33810f',
      createdAt: new Date().toISOString(),
      agentCount: 6,
      traceCount: 4120
    }
  ];

  try {
    const q = query(collection(db, 'projects'), where('ownerId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty && userId.startsWith('demo-engineer-')) {
          callback(defaultDemoProjects);
          return;
        }
        const projs: TelemetryProject[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || 'Untitled Project',
            description: d.description || '',
            environment: d.environment || 'production',
            ownerId: d.ownerId,
            apiKey: d.apiKey || `ap_live_${docSnap.id}`,
            createdAt: d.createdAt || new Date().toISOString(),
            agentCount: d.agentCount || 0,
            traceCount: d.traceCount || 0
          };
        });
        callback(projs.length > 0 ? projs : (userId.startsWith('demo-engineer-') ? defaultDemoProjects : []));
      },
      (err) => {
        console.warn('Projects subscription warning (using safe fallback):', err);
        if (userId.startsWith('demo-engineer-')) {
          callback(defaultDemoProjects);
        } else if (onError) {
          onError(err);
        }
      }
    );
  } catch (err) {
    if (userId.startsWith('demo-engineer-')) {
      callback(defaultDemoProjects);
    }
    return () => {};
  }
}

export async function deleteTelemetryProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId));
}
