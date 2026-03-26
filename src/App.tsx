import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw, 
  History, 
  Users, 
  Menu, 
  X, 
  Download, 
  Upload, 
  Settings, 
  User, 
  UserPlus,
  LogOut,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  Trophy,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Printer,
  Moon,
  Sun
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from "xlsx";
import { toast, Toaster } from "sonner";
import { cn } from "./lib/utils";
import { 
  getEmployees, 
  saveEmployees, 
  getHistory, 
  saveHistory, 
  getConfig, 
  saveConfig, 
  getAdmins, 
  saveAdmins, 
  getCurrentOrder, 
  saveCurrentOrder,
  performNewSort 
} from "./store";
import { Employee, SortHistory, AppConfig, AdminUser } from "./types";

// --- Utils ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- Components ---

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(pre-hooks/color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};

const Banner = ({ config }: { config: AppConfig }) => (
  <div 
    className="relative w-full h-[25vh] bg-cover bg-center flex items-center justify-center overflow-hidden"
    style={{ backgroundImage: `url(${config.bannerUrl})` }}
  >
    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
    <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
      <img 
        src={config.logoUrl} 
        alt="Logo" 
        className="w-16 h-16 md:w-24 md:h-24 rounded-full border-4 border-white shadow-xl object-cover"
        referrerPolicy="no-referrer"
      />
      <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg tracking-tight">
        {config.title}
      </h1>
    </div>
  </div>
);

const EmployeeCard = ({ employee, index }: { employee: Employee; index: number; key?: string }) => {
  const getTrophyColor = (idx: number) => {
    switch (idx) {
      case 0: return "text-yellow-500"; // Gold
      case 1: return "text-gray-400";   // Silver
      case 2: return "text-amber-700";  // Bronze
      case 3: return "text-blue-500";   // Blue
      case 4: return "text-green-500";  // Green
      default: return null;
    }
  };

  const trophyColor = getTrophyColor(index);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden",
        index < 5 && "border-l-4",
        index === 0 && "border-l-yellow-500",
        index === 1 && "border-l-gray-400",
        index === 2 && "border-l-amber-700",
        index === 3 && "border-l-blue-500",
        index === 4 && "border-l-green-500"
      )}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg overflow-hidden border-2 border-blue-500/20">
        {employee.photo ? (
          <img src={employee.photo} alt={employee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          employee.name.charAt(0)
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{employee.name}</h3>
          {trophyColor && <Trophy size={16} className={trophyColor} />}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Posição #{index + 1}</p>
      </div>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center font-bold",
        index < 5 ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" : "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
      )}>
        {index + 1}
      </div>
    </motion.div>
  );
};

const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="bg-emerald-600 rounded-2xl p-4 text-white shadow-lg shadow-emerald-600/20 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-emerald-200" />
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-100">Horário do Sorteio Atingido!</p>
        </div>
        <RefreshCw size={20} className="animate-spin text-emerald-200" />
      </div>
    );
  }

  return (
    <div className="bg-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <Clock size={20} className="text-blue-200" />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-100">Próximo Sorteio em:</p>
      </div>
      <div className="flex justify-between items-center px-2">
        {[
          { label: "Dias", value: timeLeft.d },
          { label: "Horas", value: timeLeft.h },
          { label: "Min", value: timeLeft.m },
          { label: "Seg", value: timeLeft.s },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="text-2xl font-black leading-none">{String(item.value).padStart(2, '0')}</span>
            <span className="text-[10px] font-bold uppercase text-blue-200 mt-1">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Pages ---

const Home = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [lastSort, setLastSort] = useState<SortHistory | null>(null);
  const notifiedRef = useRef<string | null>(null);

  useEffect(() => {
    setEmployees(getEmployees());
    setOrder(getCurrentOrder());
    setConfig(getConfig());
    const history = getHistory();
    if (history.length > 0) {
      setLastSort(history[0]);
    }

    // Monitor for new sorts from other tabs
    const channel = new BroadcastChannel("lunch_queue_events");
    channel.onmessage = (event) => {
      if (event.data.type === "NEW_SORT" || event.data.type === "DATA_UPDATE") {
        setEmployees(getEmployees());
        setOrder(getCurrentOrder());
        const updatedHistory = getHistory();
        if (updatedHistory.length > 0) {
          setLastSort(updatedHistory[0]);
        }
        
        if (event.data.type === "NEW_SORT") {
          toast.success("Um novo sorteio foi realizado!", {
            description: "A fila do almoço foi atualizada.",
            icon: <RefreshCw className="text-emerald-500" size={16} />
          });
          
          if (Notification.permission === "granted") {
            new Notification("Novo Sorteio Realizado!", {
              body: "A fila do almoço acaba de ser atualizada. Confira sua posição!",
              icon: config.logoUrl
            });
          }
        }
      }
    };

    return () => channel.close();
  }, [config.logoUrl]);

  // Check for nextSortDate expiry and trigger automatic sort
  useEffect(() => {
    if (!config.nextSortDate) return;

    const check = () => {
      const target = new Date(config.nextSortDate!).getTime();
      const now = new Date().getTime();
      
      if (now >= target) {
        // Double check config from localStorage to avoid race conditions with other tabs
        const currentConfig = getConfig();
        if (currentConfig.nextSortDate === config.nextSortDate) {
          // Perform automatic sort
          performNewSort("Sistema (Automático)");
          
          // Clear nextSortDate in config to prevent repeated triggers
          const updatedConfig = { ...currentConfig, nextSortDate: "" };
          saveConfig(updatedConfig);
          setConfig(updatedConfig);
          
          // Notify other tabs
          const channel = new BroadcastChannel("lunch_queue_events");
          channel.postMessage({ type: "NEW_SORT" });
          channel.close();
          
          // Update local state
          setOrder(getCurrentOrder());
          const history = getHistory();
          if (history.length > 0) setLastSort(history[0]);

          toast.success("Sorteio Automático Realizado!", {
            description: "A fila foi atualizada conforme o horário agendado.",
            icon: <RefreshCw className="text-emerald-500" size={16} />,
            duration: 10000
          });

          if (Notification.permission === "granted") {
            new Notification("Sorteio Automático Realizado!", {
              body: "A fila do almoço foi atualizada automaticamente conforme agendado.",
              icon: config.logoUrl
            });
          }
        }
      }
    };

    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [config.nextSortDate, config.logoUrl]);

  const sortedEmployees = order
    .map(id => employees.find(e => e.id === id))
    .filter((e): e is Employee => !!e);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12 transition-colors duration-300">
      <Banner config={config} />
      
      <div className="max-w-2xl mx-auto px-4 -mt-6 relative z-20">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 mb-8 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Users className="text-blue-600 dark:text-blue-400" />
              Fila Atual
            </h2>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {sessionStorage.getItem("is_admin") === "true" && (
                <button 
                  onClick={() => {
                    // We need handlePrint here, but it's defined in AdminPanel.
                    // Let's move it to a shared utility or duplicate it for now.
                    // Actually, let's just use a custom print logic for Home.
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      const activeOrder = getCurrentOrder();
                      const allEmployees = getEmployees();
                      const sorted = activeOrder
                        .map(id => allEmployees.find(e => e.id === id))
                        .filter((e): e is Employee => !!e);
                      
                      const employeesList = sorted
                        .map((e, index) => `
                          <tr>
                            <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: center; font-weight: bold; width: 40px;">${index + 1}</td>
                            <td style="border: 1px solid #ddd; padding: 6px 10px;">${e.name}</td>
                          </tr>
                        `).join("");

                      printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <title>Fila do Almoço - ${config.title}</title>
                            <style>
                              @page { size: auto; margin: 10mm; }
                              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; color: #333; margin: 0; }
                              .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
                              .header h1 { margin: 0; color: #1e40af; font-size: 20px; }
                              .header-info { text-align: right; }
                              .container { display: grid; grid-template-columns: ${sorted.length > 30 ? '1fr 1fr' : '1fr'}; gap: 20px; }
                              table { width: 100%; border-collapse: collapse; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                              th { background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 8px; text-align: left; color: #1e40af; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
                              td { border: 1px solid #e5e7eb; padding: 6px 10px; font-size: 13px; }
                              tr:nth-child(even) { background-color: #f9fafb; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <div>
                                <h1>${config.title}</h1>
                                <p style="margin: 3px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">Fila de Almoço Atual</p>
                              </div>
                              <div class="header-info">
                                <p style="margin: 0; font-size: 14px; font-weight: bold;">Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                                <p style="margin: 3px 0 0 0; font-size: 12px; color: #6b7280;">Total: ${sorted.length} funcionários</p>
                              </div>
                            </div>
                            <div class="container">
                              <table>
                                <thead><tr><th style="width: 40px; text-align: center;">#</th><th>Nome</th></tr></thead>
                                <tbody>${employeesList}</tbody>
                              </table>
                            </div>
                            <script>window.onload = () => { setTimeout(() => { window.print(); }, 500); };</script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }}
                  className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                  title="Imprimir Fila Atual"
                >
                  <Printer size={16} />
                  Imprimir
                </button>
              )}
              <Link 
                to="/login" 
                className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Settings size={16} />
                Admin
              </Link>
            </div>
          </div>

          {config.nextSortDate && <Countdown targetDate={config.nextSortDate} />}

          {lastSort && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Último Sorteio</p>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {new Date(lastSort.date).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              {lastSort.responsibleAdmin && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">Responsável</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{lastSort.responsibleAdmin}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {sortedEmployees.length > 0 ? (
            <div className="grid gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="text-yellow-500" size={20} />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Ranking de Sorteio</h3>
              </div>
              {sortedEmployees.map((employee, idx) => (
                <EmployeeCard key={employee.id} employee={employee} index={idx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum sorteio realizado ainda.</p>
              <p className="text-sm">Acesse o painel administrativo para iniciar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const admins = getAdmins();
    const admin = admins.find(a => a.username === username && a.password === password);
    
    if (admin) {
      sessionStorage.setItem("is_admin", "true");
      sessionStorage.setItem("admin_username", admin.username);
      navigate("/admin");
    } else {
      setError("Usuário ou senha inválidos.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Acesso Restrito</h1>
          <p className="text-gray-500 dark:text-gray-400">Faça login para gerenciar a fila</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
              placeholder="••••••"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            Entrar
          </button>
        </form>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <ThemeToggle />
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            Voltar para o início
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<"employees" | "history">("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<SortHistory[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  
  const [tempPhoto, setTempPhoto] = useState<string>("");
  const [tempBanner, setTempBanner] = useState<string>("");
  const [tempLogo, setTempLogo] = useState<string>("");

  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [admins, setAdmins] = useState<AdminUser[]>(getAdmins());
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("is_admin") !== "true") {
      navigate("/login");
    }
    setEmployees(getEmployees());
    setHistory(getHistory());
    setConfig(getConfig());
    setAdmins(getAdmins());
  }, [navigate]);

  const broadcastEvent = (type: string) => {
    const channel = new BroadcastChannel("lunch_queue_events");
    channel.postMessage({ type });
    channel.close();
  };

  const handleLogout = () => {
    sessionStorage.removeItem("is_admin");
    sessionStorage.removeItem("admin_username");
    navigate("/");
  };

  const handleNewSort = () => {
    if (employees.length === 0) {
      toast.error("Adicione funcionários antes de realizar um sorteio.");
      return;
    }
    const adminUsername = sessionStorage.getItem("admin_username") || "Admin";
    performNewSort(adminUsername);
    setHistory(getHistory());
    
    // Notify other tabs
    broadcastEvent("NEW_SORT");
    
    toast.success("Novo sorteio realizado com sucesso!");
    navigate("/");
  };

  const handleDeleteEmployee = (id: string) => {
    const updated = employees.filter(e => e.id !== id);
    saveEmployees(updated);
    setEmployees(updated);
    broadcastEvent("DATA_UPDATE");
    toast.success("Funcionário removido.");
  };

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    if (!name) {
      toast.error("O nome do funcionário é obrigatório.");
      return;
    }
    const photo = tempPhoto || (formData.get("photo") as string);

    if (editingEmployee) {
      const updated = employees.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, name, photo, active: emp.active } : emp
      );
      saveEmployees(updated);
      setEmployees(updated);
      toast.success("Funcionário atualizado.");
    } else {
      const newEmp: Employee = {
        id: crypto.randomUUID(),
        name,
        photo,
        active: true
      };
      const updated = [...employees, newEmp];
      saveEmployees(updated);
      setEmployees(updated);
      toast.success("Funcionário cadastrado.");
    }
    broadcastEvent("DATA_UPDATE");
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setTempPhoto("");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (Array.isArray(jsonData)) {
          const newEmployees: Employee[] = jsonData.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            name: item.name || item.Nome || "Sem Nome",
            photo: item.photo || item.Foto || "",
            active: true
          }));

          const updated = [...employees, ...newEmployees];
          saveEmployees(updated);
          setEmployees(updated);
          broadcastEvent("DATA_UPDATE");
          toast.success("Lista importada com sucesso!");
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao importar arquivo.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(employees.map(e => ({
      id: e.id,
      name: e.name,
      // Photo is excluded from Excel export to avoid the 32767 character limit error
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Funcionários");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "funcionarios.xlsx";
    a.click();
  };

  const handleDownloadDB = () => {
    const db = {
      employees: getEmployees(),
      history: getHistory(),
      config: getConfig(),
      order: getCurrentOrder()
    };
    const data = JSON.stringify(db, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_fila_almoco.json";
    a.click();
  };

  const handleClearList = () => {
    saveEmployees([]);
    setEmployees([]);
    broadcastEvent("DATA_UPDATE");
    toast.success("Lista de funcionários limpa.");
  };

  const handlePrint = (historyEntry?: SortHistory) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("O bloqueador de pop-ups impediu a impressão. Por favor, permita pop-ups para este site.");
      return;
    }

    let listToPrint: { name: string }[] = [];
    let printDate = new Date().toLocaleDateString('pt-BR');
    let subtitle = "Lista de Controle de Almoço";

    if (historyEntry) {
      listToPrint = historyEntry.order
        .map(id => employees.find(e => e.id === id))
        .filter((e): e is Employee => !!e)
        .map(e => ({ name: e.name }));
      printDate = new Date(historyEntry.date).toLocaleDateString('pt-BR');
      subtitle = `Lista de Almoço - Sorteio de ${new Date(historyEntry.date).toLocaleString('pt-BR')}`;
    } else {
      listToPrint = employees.filter(e => e.active).map(e => ({ name: e.name }));
    }
    
    if (listToPrint.length === 0) {
      toast.error("Não há funcionários para imprimir.");
      printWindow.close();
      return;
    }

    const employeesList = listToPrint
      .map((e, index) => `
        <tr>
          <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: center; font-weight: bold; width: 40px;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 6px 10px;">${e.name}</td>
        </tr>
      `).join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Almoço - ${config.title}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; color: #333; margin: 0; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #1e40af; font-size: 20px; }
            .header-info { text-align: right; }
            .container { 
              display: grid; 
              grid-template-columns: ${listToPrint.length > 30 ? '1fr 1fr' : '1fr'}; 
              gap: 20px; 
            }
            table { width: 100%; border-collapse: collapse; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            th { background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 8px; text-align: left; color: #1e40af; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em; }
            td { border: 1px solid #e5e7eb; padding: 6px 10px; font-size: 13px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${config.title}</h1>
              <p style="margin: 3px 0 0 0; color: #6b7280; font-size: 14px; font-weight: 500;">${subtitle}</p>
            </div>
            <div class="header-info">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">Data: ${printDate}</p>
              <p style="margin: 3px 0 0 0; font-size: 12px; color: #6b7280;">Total: ${listToPrint.length} funcionários</p>
            </div>
          </div>
          
          <div class="container">
            ${listToPrint.length > 30 ? `
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Nome</th>
                  </tr>
                </thead>
                <tbody>
                  ${listToPrint.slice(0, Math.ceil(listToPrint.length / 2)).map((e, i) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: center; font-weight: bold;">${i + 1}</td>
                      <td style="border: 1px solid #ddd; padding: 6px 10px;">${e.name}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Nome</th>
                  </tr>
                </thead>
                <tbody>
                  ${listToPrint.slice(Math.ceil(listToPrint.length / 2)).map((e, i) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: center; font-weight: bold;">${i + Math.ceil(listToPrint.length / 2) + 1}</td>
                      <td style="border: 1px solid #ddd; padding: 6px 10px;">${e.name}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : `
              <table>
                <thead>
                  <tr>
                    <th style="width: 40px; text-align: center;">#</th>
                    <th>Nome do Funcionário</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeesList}
                </tbody>
              </table>
            `}
          </div>
          
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setShowMenu(false);
  };

  const handleSaveConfig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConfig: AppConfig = {
      title: formData.get("title") as string,
      bannerUrl: tempBanner || (formData.get("bannerUrl") as string),
      logoUrl: tempLogo || (formData.get("logoUrl") as string),
      nextSortDate: formData.get("nextSortDate") as string,
    };
    saveConfig(newConfig);
    setConfig(newConfig);
    broadcastEvent("DATA_UPDATE");
    setShowConfigModal(false);
    setTempBanner("");
    setTempLogo("");
    toast.success("Configurações salvas.");
  };

  const handleSaveAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const newAdmin: AdminUser = {
      id: crypto.randomUUID(),
      username,
      password
    };
    const updated = [...admins, newAdmin];
    saveAdmins(updated);
    setAdmins(updated);
    setShowAdminModal(false);
    toast.success("Administrador adicionado.");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 dark:text-gray-100 leading-tight">Painel Admin</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Gestão da Fila</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link 
              to="/"
              className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              <ChevronRight size={16} className="rotate-180" />
              Ver Fila
            </Link>
            <button 
              onClick={handleNewSort}
              className="hidden md:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <RefreshCw size={16} />
              Novo Sorteio
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600"
              >
                {showMenu ? <X size={24} /> : <Menu size={24} />}
              </button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-800 mb-2">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ações Rápidas</p>
                      </div>
                      <button onClick={() => { setShowEmployeeModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                        <Plus size={18} /> Adicionar Funcionário
                      </button>
                      <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium cursor-pointer">
                        <Upload size={18} /> Importar Lista (.xlsx)
                        <input type="file" accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
                      </label>
                      <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                        <Download size={18} /> Exportar Lista
                      </button>
                      <button onClick={handleClearList} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm font-medium">
                        <Trash2 size={18} /> Limpar Lista
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                      <button onClick={handleDownloadDB} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium">
                        <Download size={18} /> Baixar Banco de Dados
                      </button>
                      <button onClick={() => { setShowAdminModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium">
                        <User size={18} /> Perfil Administrador
                      </button>
                      <button onClick={() => { setShowConfigModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium">
                        <Settings size={18} /> Personalizar App
                      </button>
                      <button 
                        onClick={() => {
                          if (Notification.permission !== "granted") {
                            Notification.requestPermission().then(permission => {
                              if (permission === "granted") {
                                toast.success("Notificações ativadas!");
                              }
                            });
                          } else {
                            toast.info("Notificações já estão ativadas.");
                          }
                          setShowMenu(false);
                        }} 
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors text-sm font-medium"
                      >
                        <Clock size={18} /> Ativar Notificações
                      </button>
                      <div className="h-px bg-gray-100 my-2" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors text-sm font-medium">
                        <LogOut size={18} /> Sair
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-[73px] z-30">
        <div className="max-w-5xl mx-auto flex">
          <button 
            onClick={() => setActiveTab("employees")}
            className={cn(
              "flex-1 py-3 md:py-4 text-xs md:text-sm font-bold transition-all border-b-2",
              activeTab === "employees" ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Users size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden xs:inline">Funcionários</span>
              <span className="xs:hidden">Func.</span>
              <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md text-[10px] text-gray-600 dark:text-gray-400">{employees.length}</span>
            </div>
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn(
              "flex-1 py-3 md:py-4 text-xs md:text-sm font-bold transition-all border-b-2",
              activeTab === "history" ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <History size={16} className="md:w-[18px] md:h-[18px]" />
              Histórico
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-grow p-4 max-w-5xl mx-auto w-full">
        {activeTab === "employees" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between md:hidden">
              <button 
                onClick={handleNewSort}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw size={18} />
                Novo Sorteio
              </button>
            </div>

            {employees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {employees.map((emp) => (
                  <div key={emp.id} className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                      {emp.photo ? (
                        <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-sm md:text-base">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className={cn(
                        "font-bold truncate text-sm md:text-base",
                        emp.active ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-600 line-through"
                      )}>{emp.name}</h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {emp.active ? "Participa do sorteio" : "Não participa"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 md:gap-1">
                      <button 
                        onClick={() => {
                          const updated = employees.map(e => e.id === emp.id ? { ...e, active: !e.active } : e);
                          setEmployees(updated);
                          saveEmployees(updated);
                        }}
                        className={cn(
                          "p-1.5 md:p-2 rounded-lg transition-colors",
                          emp.active ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" : "text-gray-300 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        title={emp.active ? "Desativar" : "Ativar"}
                      >
                        {emp.active ? <CheckCircle2 size={16} className="md:w-[18px] md:h-[18px]" /> : <Circle size={16} className="md:w-[18px] md:h-[18px]" />}
                      </button>
                      <button 
                        onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }}
                        className="p-1.5 md:p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="md:w-[18px] md:h-[18px]" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Users className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Nenhum funcionário</h3>
                <p className="text-gray-400 dark:text-gray-500 mb-6">Adicione funcionários para começar a organizar a fila.</p>
                <button 
                  onClick={() => setShowEmployeeModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold"
                >
                  Adicionar Agora
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Histórico de Sorteios</h2>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                <Printer size={16} />
                Imprimir Lista Atual
              </button>
            </div>
            {history.length > 0 ? (
              <div className="grid gap-3 md:gap-4">
                {history.map((entry) => (
                  <div key={entry.id} className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                          <History size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sorteio realizado em</p>
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base">{new Date(entry.date).toLocaleString('pt-BR')}</h3>
                          {entry.responsibleAdmin && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">Por: <span className="font-bold text-blue-600 dark:text-blue-400">{entry.responsibleAdmin}</span></p>
                          )}
                        </div>
                      </div>
                      <div className="self-start sm:self-center flex items-center gap-2">
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400">
                          {entry.order.length} Pessoas
                        </div>
                        <button 
                          onClick={() => handlePrint(entry)}
                          className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Imprimir este sorteio"
                        >
                          <Printer size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {entry.order.slice(0, 5).map((id, idx) => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? (
                          <div key={id} className="flex items-center gap-1.5 md:gap-2 bg-gray-50 dark:bg-gray-900 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-gray-100 dark:border-gray-800">
                            <span className="text-[9px] md:text-[10px] font-bold text-blue-600 dark:text-blue-400">{idx + 1}º</span>
                            <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">{emp.name}</span>
                          </div>
                        ) : null;
                      })}
                      {entry.order.length > 5 && (
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800 text-[10px] md:text-sm text-gray-400 dark:text-gray-500">
                          + {entry.order.length - 5} outros
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                <History className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Sem histórico</h3>
                <p className="text-gray-400 dark:text-gray-500">Os sorteios realizados aparecerão aqui.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showEmployeeModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEmployeeModal(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 1 }} 
              className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{editingEmployee ? "Editar Funcionário" : "Novo Funcionário"}</h2>
                <button onClick={() => setShowEmployeeModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEmployee} className="p-6 space-y-6 overflow-y-auto">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400 group-hover:bg-blue-50/30">
                      {(tempPhoto || editingEmployee?.photo) ? (
                        <img src={tempPhoto || editingEmployee?.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
                          <Camera size={32} strokeWidth={1.5} />
                        </div>
                      )}
                      
                      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <div className="flex flex-col items-center text-white">
                          <Upload size={20} />
                          <span className="text-[10px] font-bold mt-1 uppercase">Upload</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const base64 = await fileToBase64(file);
                              setTempPhoto(base64);
                            }
                          }}
                        />
                      </label>
                    </div>
                    
                    {/* Floating Action Button for Mobile */}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white dark:border-gray-900 cursor-pointer sm:hidden">
                      <Camera size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await fileToBase64(file);
                            setTempPhoto(base64);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-widest">Foto do Funcionário</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      name="name" 
                      defaultValue={editingEmployee?.name} 
                      required 
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                      placeholder="Ex: João Silva" 
                    />
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                      <span className="bg-white dark:bg-gray-900 px-3 text-gray-300 dark:text-gray-600">Ou use uma URL</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Link da Imagem</label>
                    <div className="relative group">
                      <input 
                        name="photo" 
                        value={tempPhoto || editingEmployee?.photo || ""} 
                        onChange={(e) => setTempPhoto(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                        placeholder="https://exemplo.com/foto.jpg" 
                      />
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" size={18} />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    {editingEmployee ? <Edit size={18} /> : <Plus size={18} />}
                    {editingEmployee ? "Salvar Alterações" : "Cadastrar Funcionário"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowEmployeeModal(false)}
                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm md:text-base sm:hidden"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfigModal(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 1 }} 
              className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">Personalizar App</h2>
                <button onClick={() => setShowConfigModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveConfig} className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Título da Empresa</label>
                    <input 
                      name="title" 
                      defaultValue={config.title} 
                      required 
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Próximo Sorteio (Data/Hora)</label>
                    <div className="relative group">
                      <input 
                        type="datetime-local" 
                        name="nextSortDate" 
                        defaultValue={config.nextSortDate} 
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100" 
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" size={18} />
                    </div>
                  </div>
                  
                  <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Banner da Empresa</label>
                      <div className="flex flex-col gap-3">
                        <div className="w-full h-28 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group transition-all hover:border-blue-400 hover:bg-blue-50/30">
                          {(tempBanner || config.bannerUrl) ? (
                            <img src={tempBanner || config.bannerUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon size={32} strokeWidth={1.5} className="text-gray-300 dark:text-gray-600" />
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <div className="flex flex-col items-center text-white">
                              <Upload size={20} />
                              <span className="text-[10px] font-bold mt-1 uppercase">Upload Banner</span>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const base64 = await fileToBase64(file);
                                  setTempBanner(base64);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="relative group">
                          <input 
                            name="bannerUrl" 
                            value={tempBanner || config.bannerUrl} 
                            onChange={(e) => setTempBanner(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100" 
                            placeholder="Ou cole a URL do banner"
                          />
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Logo da Empresa</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 dark:bg-gray-800 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden relative group flex-shrink-0 transition-all hover:border-blue-400 hover:bg-blue-50/30">
                          {(tempLogo || config.logoUrl) ? (
                            <img src={tempLogo || config.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ImageIcon size={24} strokeWidth={1.5} className="text-gray-300 dark:text-gray-600" />
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Upload size={18} className="text-white" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const base64 = await fileToBase64(file);
                                  setTempLogo(base64);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="flex-grow relative group">
                          <input 
                            name="logoUrl" 
                            value={tempLogo || config.logoUrl} 
                            onChange={(e) => setTempLogo(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-xs md:text-sm font-medium text-gray-800 dark:text-gray-100" 
                            placeholder="Ou cole a URL do logo"
                          />
                          <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Salvar Configurações
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm md:text-base sm:hidden"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdminModal(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 1 }} 
              className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">Gerenciar Administradores</h2>
                <button onClick={() => setShowAdminModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Administradores Atuais</p>
                  <div className="grid gap-2">
                    {admins.map(admin => (
                      <div key={admin.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                            <User size={16} />
                          </div>
                          <span className="font-bold text-gray-700 dark:text-gray-200 text-sm md:text-base">{admin.username}</span>
                        </div>
                        {admins.length > 1 && (
                          <button 
                            onClick={() => {
                              const updated = admins.filter(a => a.id !== admin.id);
                              saveAdmins(updated);
                              setAdmins(updated);
                              toast.success("Administrador removido.");
                            }}
                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <form onSubmit={handleSaveAdmin} className="space-y-5 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Adicionar Novo Admin</p>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Usuário</label>
                      <input 
                        name="username" 
                        required 
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100" 
                        placeholder="Nome de usuário"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Senha</label>
                      <input 
                        type="password" 
                        name="password" 
                        required 
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100" 
                        placeholder="Senha de acesso"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex flex-col gap-3">
                    <button 
                      type="submit" 
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Adicionar Administrador
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowAdminModal(false)}
                      className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm md:text-base sm:hidden"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}
