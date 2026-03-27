import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Employee, SortHistory, AppConfig, AdminUser } from "./types";

const COLLECTIONS = {
  EMPLOYEES: "employees",
  HISTORY: "history",
  CONFIG: "config",
  USERS: "users",
};

const DEFAULT_CONFIG: AppConfig = {
  title: "Fila do Almoço",
  bannerUrl: "https://picsum.photos/seed/lunch/1200/400",
  logoUrl: "https://picsum.photos/seed/logo/200/200",
  nextSortDate: "",
};

// --- Config ---

export const getConfig = async (): Promise<AppConfig> => {
  const path = `${COLLECTIONS.CONFIG}/settings`;
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, "settings");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as AppConfig;
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: AppConfig) => {
  const path = `${COLLECTIONS.CONFIG}/settings`;
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, "settings");
    await setDoc(docRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeConfig = (callback: (config: AppConfig) => void, onError?: (error: any) => void) => {
  const path = `${COLLECTIONS.CONFIG}/settings`;
  const docRef = doc(db, COLLECTIONS.CONFIG, "settings");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as AppConfig);
    } else {
      callback(DEFAULT_CONFIG);
    }
  }, (error) => {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, path);
  });
};

// --- Employees ---

export const getEmployees = async (): Promise<Employee[]> => {
  const path = COLLECTIONS.EMPLOYEES;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(doc => doc.data() as Employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveEmployees = async (employees: Employee[]) => {
  const path = COLLECTIONS.EMPLOYEES;
  try {
    const batch = writeBatch(db);
    for (const employee of employees) {
      const docRef = doc(db, COLLECTIONS.EMPLOYEES, employee.id);
      batch.set(docRef, employee);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const clearEmployees = async () => {
  const path = COLLECTIONS.EMPLOYEES;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveEmployee = async (employee: Employee) => {
  const path = `${COLLECTIONS.EMPLOYEES}/${employee.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, employee.id);
    await setDoc(docRef, employee);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteEmployee = async (id: string) => {
  const path = `${COLLECTIONS.EMPLOYEES}/${id}`;
  try {
    const docRef = doc(db, COLLECTIONS.EMPLOYEES, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeEmployees = (callback: (employees: Employee[]) => void, onError?: (error: any) => void) => {
  const path = COLLECTIONS.EMPLOYEES;
  const q = query(collection(db, path), orderBy("name"));
  return onSnapshot(q, (querySnapshot) => {
    const employees = querySnapshot.docs.map(doc => doc.data() as Employee);
    callback(employees);
  }, (error) => {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, path);
  });
};

// --- History ---

export const getHistory = async (): Promise<SortHistory[]> => {
  const path = COLLECTIONS.HISTORY;
  try {
    const q = query(collection(db, path), orderBy("date", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SortHistory);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveHistoryEntry = async (entry: SortHistory) => {
  const path = `${COLLECTIONS.HISTORY}/${entry.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.HISTORY, entry.id);
    await setDoc(docRef, entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeHistory = (callback: (history: SortHistory[]) => void, onError?: (error: any) => void) => {
  const path = COLLECTIONS.HISTORY;
  const q = query(collection(db, path), orderBy("date", "desc"), limit(50));
  return onSnapshot(q, (querySnapshot) => {
    const history = querySnapshot.docs.map(doc => doc.data() as SortHistory);
    callback(history);
  }, (error) => {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, path);
  });
};

// --- Current Order ---

export const getCurrentOrder = async (): Promise<string[]> => {
  const path = `${COLLECTIONS.CONFIG}/currentOrder`;
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, "currentOrder");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().order as string[];
    }
    return [];
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveCurrentOrder = async (order: string[]) => {
  const path = `${COLLECTIONS.CONFIG}/currentOrder`;
  try {
    const docRef = doc(db, COLLECTIONS.CONFIG, "currentOrder");
    await setDoc(docRef, { order });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const subscribeCurrentOrder = (callback: (order: string[]) => void, onError?: (error: any) => void) => {
  const path = `${COLLECTIONS.CONFIG}/currentOrder`;
  const docRef = doc(db, COLLECTIONS.CONFIG, "currentOrder");
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().order as string[]);
    } else {
      callback([]);
    }
  }, (error) => {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, path);
  });
};

// --- Admins ---

export const getAdmins = async (): Promise<AdminUser[]> => {
  const path = COLLECTIONS.USERS;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.email || data.username || "Unknown",
        photo: data.photo || "",
        canEditAdmins: data.canEditAdmins || false,
      } as AdminUser;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return [];
  }
};

export const saveAdmin = async (admin: AdminUser) => {
  const path = `${COLLECTIONS.USERS}/${admin.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, admin.id);
    const data: any = {
      uid: admin.id,
      email: admin.username,
      role: "admin",
      photo: admin.photo || "",
      canEditAdmins: admin.canEditAdmins || false,
    };
    if (admin.password) {
      data.password = admin.password;
    }
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteAdmin = async (id: string) => {
  const path = `${COLLECTIONS.USERS}/${id}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeAdmins = (callback: (admins: AdminUser[]) => void, onError?: (error: any) => void) => {
  const path = COLLECTIONS.USERS;
  const q = query(collection(db, path));
  return onSnapshot(q, (querySnapshot) => {
    const admins = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.email || data.username || "Unknown",
        photo: data.photo || "",
        canEditAdmins: data.canEditAdmins || false,
      } as AdminUser;
    });
    callback(admins);
  }, (error) => {
    if (onError) onError(error);
    handleFirestoreError(error, OperationType.GET, path);
  });
};

export const checkIsAdmin = async (uid: string, email?: string | null): Promise<AdminUser | null> => {
  if (email === "l2xbrasil@gmail.com") {
    return {
      id: uid,
      username: email,
      canEditAdmins: true,
      photo: ""
    };
  }
  
  try {
    const docRef = doc(db, COLLECTIONS.USERS, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.role === "admin") {
        return {
          id: docSnap.id,
          username: data.email || data.username || "Unknown",
          photo: data.photo || "",
          canEditAdmins: data.canEditAdmins || false,
        } as AdminUser;
      }
    }
    return null;
  } catch (error) {
    console.error("Error checking admin status", error);
    return null;
  }
};

// --- Sort Logic ---

export const performNewSort = async (responsibleAdmin?: string) => {
  try {
    const employees = await getEmployees();
    const activeEmployees = employees.filter(e => e.active);
    
    if (activeEmployees.length === 0) return [];

    const shuffled = [...activeEmployees];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const order = shuffled.map((e) => e.id);
    
    await saveCurrentOrder(order);
    
    const newEntry: SortHistory = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      order: order,
      responsibleAdmin,
    };
    await saveHistoryEntry(newEntry);
    
    return order;
  } catch (error) {
    console.error("Error performing sort:", error);
    return [];
  }
};
