import { Employee, SortHistory, AppConfig, AdminUser } from "./types";

const STORAGE_KEYS = {
  EMPLOYEES: "lunch_employees",
  HISTORY: "lunch_history",
  CONFIG: "lunch_config",
  CURRENT_ORDER: "lunch_current_order",
  ADMINS: "lunch_admins",
};

const DEFAULT_CONFIG: AppConfig = {
  title: "Fila do Almoço",
  bannerUrl: "https://picsum.photos/seed/lunch/1200/400",
  logoUrl: "https://picsum.photos/seed/logo/200/200",
  nextSortDate: "",
};

// --- Event Emitter for Subscriptions ---
type Callback = (data: any) => void;
const listeners: { [key: string]: Set<Callback> } = {};

const subscribe = (key: string, callback: Callback) => {
  if (!listeners[key]) {
    listeners[key] = new Set();
  }
  listeners[key].add(callback);
  
  // Initial call
  const data = getData(key);
  callback(data);

  return () => {
    listeners[key].delete(callback);
  };
};

const notify = (key: string) => {
  if (listeners[key]) {
    const data = getData(key);
    listeners[key].forEach(callback => callback(data));
  }
};

const getData = (key: string) => {
  const data = localStorage.getItem(key);
  if (!data) {
    if (key === STORAGE_KEYS.CONFIG) return DEFAULT_CONFIG;
    if (key === STORAGE_KEYS.EMPLOYEES) return [];
    if (key === STORAGE_KEYS.HISTORY) return [];
    if (key === STORAGE_KEYS.CURRENT_ORDER) return [];
    if (key === STORAGE_KEYS.ADMINS) return [];
    return null;
  }
  return JSON.parse(data);
};

const saveData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  notify(key);
};

// --- Config ---

export const getConfig = async (): Promise<AppConfig> => {
  return getData(STORAGE_KEYS.CONFIG);
};

export const saveConfig = async (config: AppConfig) => {
  saveData(STORAGE_KEYS.CONFIG, config);
};

export const subscribeConfig = (callback: (config: AppConfig) => void) => {
  return subscribe(STORAGE_KEYS.CONFIG, callback);
};

// --- Employees ---

export const getEmployees = async (): Promise<Employee[]> => {
  return getData(STORAGE_KEYS.EMPLOYEES);
};

export const saveEmployees = async (employees: Employee[]) => {
  saveData(STORAGE_KEYS.EMPLOYEES, employees);
};

export const saveEmployee = async (employee: Employee) => {
  const employees = await getEmployees();
  const index = employees.findIndex(e => e.id === employee.id);
  if (index >= 0) {
    employees[index] = employee;
  } else {
    employees.push(employee);
  }
  saveData(STORAGE_KEYS.EMPLOYEES, employees);
};

export const deleteEmployee = async (id: string) => {
  const employees = await getEmployees();
  const filtered = employees.filter(e => e.id !== id);
  saveData(STORAGE_KEYS.EMPLOYEES, filtered);
};

export const subscribeEmployees = (callback: (employees: Employee[]) => void) => {
  return subscribe(STORAGE_KEYS.EMPLOYEES, callback);
};

// --- History ---

export const getHistory = async (): Promise<SortHistory[]> => {
  return getData(STORAGE_KEYS.HISTORY);
};

export const saveHistoryEntry = async (entry: SortHistory) => {
  const history = await getHistory();
  history.unshift(entry);
  saveData(STORAGE_KEYS.HISTORY, history.slice(0, 50));
};

export const subscribeHistory = (callback: (history: SortHistory[]) => void) => {
  return subscribe(STORAGE_KEYS.HISTORY, callback);
};

// --- Current Order ---

export const getCurrentOrder = async (): Promise<string[]> => {
  return getData(STORAGE_KEYS.CURRENT_ORDER);
};

export const saveCurrentOrder = async (order: string[]) => {
  saveData(STORAGE_KEYS.CURRENT_ORDER, order);
};

export const subscribeCurrentOrder = (callback: (order: string[]) => void) => {
  return subscribe(STORAGE_KEYS.CURRENT_ORDER, callback);
};

// --- Admins ---

export const getAdmins = async (): Promise<AdminUser[]> => {
  return getData(STORAGE_KEYS.ADMINS);
};

export const saveAdmin = async (admin: AdminUser) => {
  const admins = await getAdmins();
  const index = admins.findIndex(a => a.id === admin.id);
  if (index >= 0) {
    admins[index] = admin;
  } else {
    admins.push(admin);
  }
  saveData(STORAGE_KEYS.ADMINS, admins);
};

export const deleteAdmin = async (id: string) => {
  const admins = await getAdmins();
  const filtered = admins.filter(a => a.id !== id);
  saveData(STORAGE_KEYS.ADMINS, filtered);
};

export const subscribeAdmins = (callback: (admins: AdminUser[]) => void) => {
  return subscribe(STORAGE_KEYS.ADMINS, callback);
};

// --- Sort Logic ---

export const performNewSort = async (responsibleAdmin?: string) => {
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
};
