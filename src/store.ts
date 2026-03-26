import { Employee, SortHistory, AppConfig, AdminUser } from "./types";

const STORAGE_KEYS = {
  EMPLOYEES: "lunch_queue_employees",
  HISTORY: "lunch_queue_history",
  CONFIG: "lunch_queue_config",
  ADMINS: "lunch_queue_admins",
  CURRENT_ORDER: "lunch_queue_current_order",
};

const DEFAULT_CONFIG: AppConfig = {
  title: "Fila do Almoço",
  bannerUrl: "https://picsum.photos/seed/lunch/1200/400",
  logoUrl: "https://picsum.photos/seed/logo/200/200",
  nextSortDate: "",
};

const DEFAULT_ADMINS: AdminUser[] = [
  { id: "1", username: "admin", password: "123" },
];

export const getEmployees = (): Employee[] => {
  const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
  const employees: Employee[] = data ? JSON.parse(data) : [];
  // Ensure all employees have the active property
  return employees.map(e => ({ ...e, active: e.active ?? true }));
};

export const saveEmployees = (employees: Employee[]) => {
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
};

export const getHistory = (): SortHistory[] => {
  const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
  return data ? JSON.parse(data) : [];
};

export const saveHistory = (history: SortHistory[]) => {
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
};

export const getConfig = (): AppConfig => {
  const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
  return data ? JSON.parse(data) : DEFAULT_CONFIG;
};

export const saveConfig = (config: AppConfig) => {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
};

export const getAdmins = (): AdminUser[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ADMINS);
  return data ? JSON.parse(data) : DEFAULT_ADMINS;
};

export const saveAdmins = (admins: AdminUser[]) => {
  localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
};

export const getCurrentOrder = (): string[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ORDER);
  return data ? JSON.parse(data) : [];
};

export const saveCurrentOrder = (order: string[]) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_ORDER, JSON.stringify(order));
};

export const performNewSort = (responsibleAdmin?: string) => {
  const allEmployees = getEmployees();
  const activeEmployees = allEmployees.filter(e => e.active);
  
  if (activeEmployees.length === 0) return [];

  const shuffled = [...activeEmployees];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const order = shuffled.map((e) => e.id);
  
  saveCurrentOrder(order);
  
  const history = getHistory();
  const newEntry: SortHistory = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    order: order,
    responsibleAdmin,
  };
  saveHistory([newEntry, ...history]);
  
  return order;
};
