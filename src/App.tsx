import React, { useState, useEffect, useRef, useMemo, Component, createContext, useContext } from "react";
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
  Sun,
  User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import * as XLSX from "xlsx";
import { toast, Toaster } from "sonner";
import { cn } from "./lib/utils";
import { 
  getEmployees, 
  saveEmployee, 
  deleteEmployee,
  saveEmployees,
  clearEmployees,
  getHistory, 
  saveHistoryEntry,
  getConfig, 
  saveConfig, 
  getCurrentOrder, 
  saveCurrentOrder,
  performNewSort,
  getAdmins,
  saveAdmin,
  deleteAdmin,
  subscribeEmployees,
  subscribeHistory,
  subscribeConfig,
  subscribeCurrentOrder,
  subscribeAdmins,
  checkIsAdmin
} from "./store";
import { auth, onAuthStateChanged, signIn, logout } from "./firebase";
import { Employee, SortHistory, AppConfig, AdminUser } from "./types";

// --- Auth Context ---

interface AuthContextType {
  user: any;
  isAdmin: AdminUser | null;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  isAdmin: null,
  loading: true,
});

const useAuth = () => React.useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const adminData = await checkIsAdmin(firebaseUser.uid, firebaseUser.email);
        setIsAdmin(adminData);
      } else {
        setIsAdmin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Utils ---

const fileToBase64 = (file: File, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = maxWidth;
        const MAX_HEIGHT = maxHeight;
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

// --- Error Boundary ---

class ErrorBoundary extends Component<any, any> {
  public state: any;
  public props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) {
            errorMessage = `Erro no Firestore: ${parsed.error}`;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="text-red-600 dark:text-red-400" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

// --- Theme Context ---

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark" || 
        (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
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

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
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

const EmployeeCard = ({ employee, index, stats }: { employee: Employee; index: number; stats?: { top1: number; top3: number; total: number }; key?: string }) => {
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
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        y: { duration: 0.2, delay: index * 0.02 }
      }}
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
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">Posição #{index + 1}</p>
          {stats && stats.total > 0 && (
            <div className="flex gap-2">
              <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-0.5">
                <Trophy size={10} /> {stats.top1}x 1º
              </span>
              <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 flex items-center gap-0.5">
                <Trophy size={10} /> {stats.top3}x Top 3
              </span>
            </div>
          )}
        </div>
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
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [history, setHistory] = useState<SortHistory[]>([]);
  const [lastSort, setLastSort] = useState<SortHistory | null>(null);
  const [error, setError] = useState<any>(null);
  const notifiedRef = useRef<string | null>(null);
  const [showFullRanking, setShowFullRanking] = useState(false);

  useEffect(() => {
    // Real-time listeners via local store subscriptions
    const unsubscribeEmployees = subscribeEmployees((data) => {
      setEmployees(data);
    }, (err: any) => setError(err));

    const unsubscribeHistory = subscribeHistory((data) => {
      setHistory(data);
      if (data.length > 0) {
        const latest = data[0];
        setLastSort(latest);
        
        // Show notification if it's a new sort
        if (notifiedRef.current && notifiedRef.current !== latest.id) {
          // Fun celebratory effect
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
            zIndex: 100
          });

          toast.success("Um novo sorteio foi realizado!", {
            description: "A fila do almoço foi atualizada.",
            icon: <RefreshCw className="text-emerald-500" size={16} />
          });
          
          if (Notification.permission === "granted") {
            new Notification("Novo Sorteio Realizado!", {
              body: "A fila do almoço acaba de ser atualizada. Confira sua posição!",
              icon: config?.logoUrl
            });
          }
        }
        notifiedRef.current = latest.id;
      }
    }, (err: any) => setError(err));

    const unsubscribeConfig = subscribeConfig((data) => {
      setConfig(data);
    }, (err: any) => setError(err));

    const unsubscribeOrder = subscribeCurrentOrder((data) => {
      setOrder(data);
    }, (err: any) => setError(err));

    return () => {
      unsubscribeEmployees();
      unsubscribeHistory();
      unsubscribeConfig();
      unsubscribeOrder();
    };
  }, [config?.logoUrl]);

  useEffect(() => {
    if (config?.title) {
      document.title = config.title;
    }
  }, [config?.title]);

  // Check for nextSortDate expiry and trigger automatic sort
  useEffect(() => {
    if (!config?.nextSortDate) return;

    const check = () => {
      const target = new Date(config.nextSortDate!).getTime();
      const now = new Date().getTime();
      
      if (now >= target) {
        // Perform automatic sort
        performNewSort("Sistema (Automático)").then(() => {
          // Clear nextSortDate in config
          const updatedConfig = { ...config, nextSortDate: "" };
          saveConfig(updatedConfig);
          
          toast.success("Sorteio Automático Realizado!", {
            description: "A fila foi atualizada conforme o horário agendado.",
            icon: <RefreshCw className="text-emerald-500" size={16} />,
            duration: 10000
          });
        });
      }
    };

    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, [config, config?.nextSortDate]);

  const rankingStats = useMemo(() => {
    const stats: Record<string, { top1: number; top3: number; total: number }> = {};
    
    history.forEach(draw => {
      draw.order.forEach((id, index) => {
        if (!stats[id]) stats[id] = { top1: 0, top3: 0, total: 0 };
        stats[id].total++;
        if (index === 0) stats[id].top1++;
        if (index < 3) stats[id].top3++;
      });
    });
    
    return stats;
  }, [history]);

  const historicalRanking = useMemo(() => {
    return employees
      .map(emp => ({
        ...emp,
        stats: rankingStats[emp.id] || { top1: 0, top3: 0, total: 0 }
      }))
      .sort((a, b) => {
        // Sort by top1, then top3, then total draws
        if (b.stats.top1 !== a.stats.top1) return b.stats.top1 - a.stats.top1;
        if (b.stats.top3 !== a.stats.top3) return b.stats.top3 - a.stats.top3;
        return b.stats.total - a.stats.total;
      });
  }, [employees, rankingStats]);

  if (error) throw error;
  if (!config) return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">Carregando...</div>;

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
                      const sorted = order
                        .map(id => employees.find(e => e.id === id))
                        .filter((e): e is Employee => !!e);
                      
                      const midPoint = Math.ceil(sorted.length / 2);
                      const leftColumn = sorted.slice(0, midPoint);
                      const rightColumn = sorted.slice(midPoint);

                      const renderTable = (items: Employee[], startIdx: number) => `
                        <table>
                          <thead><tr><th style="width: 40px; text-align: center;">#</th><th>Nome</th></tr></thead>
                          <tbody>
                            ${items.map((e, index) => `
                              <tr>
                                <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: center; font-weight: bold; width: 40px;">${startIdx + index + 1}</td>
                                <td style="border: 1px solid #ddd; padding: 6px 10px;">${e.name}</td>
                              </tr>
                            `).join("")}
                          </tbody>
                        </table>
                      `;

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
                              .container { display: grid; grid-template-columns: ${sorted.length > 25 ? '1fr 1fr' : '1fr'}; gap: 20px; }
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
                              ${renderTable(leftColumn, 0)}
                              ${sorted.length > 25 ? renderTable(rightColumn, midPoint) : ''}
                            </div>
                            <script>window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };</script>
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
                    <UserIcon size={20} />
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
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="text-blue-600 dark:text-blue-400" size={20} />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fila do Almoço</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg uppercase">
                  {sortedEmployees.length} Pessoas
                </span>
              </div>
              {sortedEmployees.map((employee, idx) => (
                <EmployeeCard 
                  key={employee.id} 
                  employee={employee} 
                  index={idx} 
                  stats={rankingStats[employee.id]}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>Nenhum sorteio realizado ainda.</p>
              <p className="text-sm">Acesse o painel administrativo para iniciar.</p>
            </div>
          )}

          {historicalRanking.some(emp => emp.stats.total > 0) && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Ranking Geral</h2>
                </div>
                <button 
                  onClick={() => setShowFullRanking(!showFullRanking)}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showFullRanking ? "Ver Menos" : "Ver Todos"}
                </button>
              </div>
              
              <div className="grid gap-4">
                {(showFullRanking ? historicalRanking : historicalRanking.slice(0, 3)).map((emp, idx) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                        idx === 0 ? "bg-yellow-100 text-yellow-700" : 
                        idx === 1 ? "bg-gray-100 text-gray-700" :
                        idx === 2 ? "bg-amber-100 text-amber-700" :
                        "bg-blue-50 text-blue-700"
                      )}>
                        {idx + 1}º
                      </div>
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-700">
                        {emp.photo ? (
                          <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold">
                            {emp.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 dark:text-gray-100">{emp.name}</h4>
                        <p className="text-xs text-gray-400">Total de sorteios: {emp.stats.total}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="text-center px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                        <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 uppercase">1º Lugar</p>
                        <p className="text-sm font-black text-yellow-700 dark:text-yellow-300">{emp.stats.top1}</p>
                      </div>
                      <div className="text-center px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Top 3</p>
                        <p className="text-sm font-black text-blue-700 dark:text-blue-300">{emp.stats.top3}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await signIn();
      if (user) {
        const adminStatus = await checkIsAdmin(user.uid, user.email);
        if (adminStatus) {
          toast.success(`Bem-vindo, ${user.displayName}!`);
          navigate("/admin");
        } else {
          toast.error("Acesso Negado", {
            description: "Seu e-mail não está na lista de administradores autorizados."
          });
          await logout();
        }
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      
      let errorMessage = "Erro ao realizar login com Google.";
      let description = "Tente novamente em instantes.";

      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup Bloqueada";
        description = "Por favor, permita popups para este site para fazer login.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "Domínio não Autorizado";
        description = "Este domínio não está autorizado no Console do Firebase.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Operação não Permitida";
        description = "O provedor Google não está habilitado no Firebase Auth.";
      } else if (error.message) {
        description = error.message;
      }

      toast.error(errorMessage, { description });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const admins = await getAdmins();
      const admin = admins.find(a => a.username === username && a.password === password);
      
      if (admin || (username === "admin" && password === "admin")) {
        // For legacy login, we still use sessionStorage but it's not ideal
        // In a real app, we'd use Firebase Auth for email/password too
        sessionStorage.setItem("is_admin", "true");
        toast.success("Login realizado com sucesso!");
        navigate("/admin");
      } else {
        toast.error("Usuário ou senha incorretos.");
      }
    } catch (error) {
      toast.error("Erro ao realizar login.");
    } finally {
      setLoading(false);
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
            <UserIcon className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Área Administrativa</h1>
          <p className="text-gray-500 dark:text-gray-400">Entre com suas credenciais para gerenciar a fila</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Usuário</label>
            <input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium text-gray-800 dark:text-gray-100" 
              placeholder="Digite seu usuário"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm font-medium text-gray-800 dark:text-gray-100" 
              placeholder="Digite sua senha"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-4"
          >
            {loading ? "Carregando..." : "Entrar com Usuário"}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500 font-bold">Ou</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 px-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl font-semibold border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </button>
        </form>
        
        <div className="flex items-center justify-center gap-4 mt-8">
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
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"employees" | "history" | "config">("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<SortHistory[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [error, setError] = useState<any>(null);
  
  const [tempPhoto, setTempPhoto] = useState<string>("");
  const [tempAdminPhoto, setTempAdminPhoto] = useState<string>("");
  const [tempBanner, setTempBanner] = useState<string | null>(null);
  const [tempLogo, setTempLogo] = useState<string | null>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  if (error) throw error;

  useEffect(() => {
    if (!authLoading) {
      const isLegacyAdmin = sessionStorage.getItem("is_admin") === "true";
      if (!isAdmin && !isLegacyAdmin) {
        navigate("/login");
      }
      setLoading(false);
    }
  }, [navigate, isAdmin, authLoading]);

  useEffect(() => {
    if (authLoading) return;
    const isLegacyAdmin = sessionStorage.getItem("is_admin") === "true";
    if (!isAdmin && !isLegacyAdmin) return;

    // Real-time listeners via local store subscriptions
    const unsubscribeEmployees = subscribeEmployees((data) => {
      setEmployees(data);
    }, (err: any) => setError(err));

    const unsubscribeHistory = subscribeHistory((data) => {
      setHistory(data);
    }, (err: any) => setError(err));

    const unsubscribeConfig = subscribeConfig((data) => {
      setConfig(data);
    }, (err: any) => setError(err));

    const unsubscribeAdmins = subscribeAdmins((data) => {
      setAdmins(data);
    }, (err: any) => setError(err));

    return () => {
      unsubscribeEmployees();
      unsubscribeHistory();
      unsubscribeConfig();
      unsubscribeAdmins();
    };
  }, [isAdmin, authLoading]);

  const handleLogout = async () => {
    sessionStorage.removeItem("is_admin");
    await logout();
    navigate("/");
  };

  const handleNewSort = async () => {
    if (employees.length === 0) {
      toast.error("Adicione funcionários antes de realizar um sorteio.");
      return;
    }
    await performNewSort("Admin");
    toast.success("Novo sorteio realizado com sucesso!");
    navigate("/");
  };

  const handleDeleteEmployee = async (id: string) => {
    await deleteEmployee(id);
    toast.success("Funcionário removido.");
  };

  const handleSaveEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    if (!name) {
      toast.error("O nome do funcionário é obrigatório.");
      return;
    }
    const photo = tempPhoto || (formData.get("photo") as string);

    const employeeData: Employee = {
      id: editingEmployee?.id || crypto.randomUUID(),
      name,
      photo,
      active: editingEmployee ? editingEmployee.active : true,
    };

    await saveEmployee(employeeData);
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setTempPhoto("");
    toast.success(editingEmployee ? "Funcionário atualizado!" : "Funcionário cadastrado.");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (Array.isArray(jsonData)) {
          if (window.confirm("Deseja limpar a lista atual antes de importar?")) {
            await clearEmployees();
          }

          const newEmployees: Employee[] = jsonData.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            name: item.name || item.Nome || "Sem Nome",
            photo: item.photo || item.Foto || "",
            active: item.active !== undefined ? item.active : (item.Ativo !== undefined ? item.Ativo : true)
          }));

          await saveEmployees(newEmployees);
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
      photo: e.photo,
      active: e.active
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
    const dbData = {
      employees,
      history,
      config
    };
    const data = JSON.stringify(dbData, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_fila_almoco.json";
    a.click();
  };

  const handleClearList = async () => {
    if (window.confirm("Tem certeza que deseja limpar toda a lista?")) {
      await clearEmployees();
      toast.success("Lista de funcionários limpa.");
    }
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
        .filter(e => !!e)
        .map(e => ({ name: e!.name }));
      printDate = new Date(historyEntry.date).toLocaleDateString('pt-BR');
      subtitle = `Sorteio realizado em ${printDate}`;
    } else {
      listToPrint = employees.filter(e => e.active).map(e => ({ name: e.name }));
    }

    const midPoint = Math.ceil(listToPrint.length / 2);
    const leftColumn = listToPrint.slice(0, midPoint);
    const rightColumn = listToPrint.slice(midPoint);

    const renderTable = (items: { name: string }[], startIdx: number) => `
      <table>
        <thead>
          <tr>
            <th class="pos">Nº</th>
            <th>Nome do Funcionário</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, idx) => `
            <tr>
              <td class="pos">${startIdx + idx + 1}</td>
              <td>${item.name}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Impressão - Fila do Almoço</title>
          <style>
            @page { size: portrait; margin: 10mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; margin: 0; }
            h1 { text-align: center; margin-bottom: 5px; font-size: 24px; color: #1e40af; }
            h2 { text-align: center; font-weight: normal; font-size: 16px; margin-top: 0; margin-bottom: 20px; color: #666; }
            .container { display: grid; grid-template-columns: ${listToPrint.length > 25 ? '1fr 1fr' : '1fr'}; gap: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
            th { background-color: #f8fafc; color: #1e40af; font-weight: bold; text-transform: uppercase; font-size: 12px; }
            .pos { width: 60px; text-align: center; font-weight: bold; background-color: #f1f5f9; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h1>${config?.title || "Fila do Almoço"}</h1>
          <h2>${subtitle}</h2>
          <div class="container">
            ${renderTable(leftColumn, 0)}
            ${listToPrint.length > 25 ? renderTable(rightColumn, midPoint) : ''}
          </div>
          <div style="margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Documento gerado em ${new Date().toLocaleString('pt-BR')}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setShowMenu(false);
  };

  const handleSaveConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newConfig: AppConfig = {
      title: formData.get("title") as string,
      bannerUrl: tempBanner !== null ? tempBanner : config.bannerUrl,
      logoUrl: tempLogo !== null ? tempLogo : config.logoUrl,
      nextSortDate: formData.get("nextSortDate") as string,
    };
    await saveConfig(newConfig);
    setConfig(newConfig);
    setShowConfigModal(false);
    setTempBanner(null);
    setTempLogo(null);
    toast.success("Configurações salvas.");
  };

  const handleSaveAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = isAdmin?.canEditAdmins ? (formData.get("username") as string) : isAdmin?.username;
    const password = formData.get("password") as string;
    const photo = tempAdminPhoto || (formData.get("photo") as string);
    const canEditAdmins = isAdmin?.canEditAdmins ? (formData.get("canEditAdmins") === "on") : isAdmin?.canEditAdmins;

    if (!username) {
      toast.error("Nome de usuário é obrigatório.");
      return;
    }

    const adminData: AdminUser = {
      id: editingAdmin?.id || (isAdmin?.canEditAdmins ? crypto.randomUUID() : isAdmin?.id || ""),
      username,
      photo,
      canEditAdmins: !!canEditAdmins,
    };
    if (password) adminData.password = password;

    await saveAdmin(adminData);
    setShowAdminModal(false);
    setEditingAdmin(null);
    setIsAddingAdmin(false);
    setTempAdminPhoto("");
    toast.success((editingAdmin || !isAdmin?.canEditAdmins) ? "Perfil atualizado." : "Administrador adicionado.");
  };

  const handleDeleteAdmin = async (id: string) => {
    if (admins.length <= 1) {
      toast.error("Não é possível remover o último administrador.");
      return;
    }
    await deleteAdmin(id);
    toast.success("Administrador removido.");
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
            <button 
              onClick={() => setShowConfigModal(true)}
              className="hidden lg:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              <Settings size={16} />
              Personalizar App
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
                      {isAdmin?.canEditAdmins && (
                        <>
                          <button onClick={() => { setShowAdminModal(true); setShowMenu(false); setIsAddingAdmin(false); setEditingAdmin(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium border-b border-gray-100 dark:border-gray-800">
                            <Users size={18} /> Gerenciar Administradores
                          </button>
                          <button onClick={() => { setShowAdminModal(true); setShowMenu(false); setIsAddingAdmin(true); setEditingAdmin(null); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium border-b border-gray-100 dark:border-gray-800">
                            <UserPlus size={18} /> Criar Administrador
                          </button>
                        </>
                      )}
                      <button onClick={() => { setShowAdminModal(true); setShowMenu(false); setIsAddingAdmin(false); setEditingAdmin(isAdmin); setTempAdminPhoto(isAdmin.photo || ""); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium">
                        <UserIcon size={18} /> Meu Perfil
                      </button>
                      <button onClick={() => { setShowConfigModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium">
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
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors text-sm font-medium"
                      >
                        <Clock size={18} /> Ativar Notificações
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors text-sm font-medium">
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
          <button 
            onClick={() => setActiveTab("config")}
            className={cn(
              "flex-1 py-3 md:py-4 text-xs md:text-sm font-bold transition-all border-b-2",
              activeTab === "config" ? "border-blue-600 text-blue-700 dark:text-blue-400" : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings size={16} className="md:w-[18px] md:h-[18px]" />
              Config.
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-grow p-4 max-w-5xl mx-auto w-full">
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 md:hidden">
              <button 
                onClick={handleNewSort}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw size={18} />
                Novo Sorteio
              </button>
              <button 
                onClick={() => setShowConfigModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-blue-600/20"
              >
                <Settings size={18} />
                Personalizar App
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
                          const updatedEmp = { ...emp, active: !emp.active };
                          const updatedList = employees.map(e => e.id === emp.id ? updatedEmp : e);
                          setEmployees(updatedList);
                          saveEmployee(updatedEmp);
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
        )}

        {activeTab === "history" && (
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

        {activeTab === "config" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Configurações do App</h2>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">Personalizar Aparência</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Altere o título, logo e banner da aplicação.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setTempBanner(config.bannerUrl || null);
                  setTempLogo(config.logoUrl || null);
                  setShowConfigModal(true);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Edit size={18} />
                Personalizar Agora
              </button>
            </div>
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
                          {(tempBanner !== null ? tempBanner : config.bannerUrl) ? (
                            <img src={tempBanner !== null ? tempBanner : config.bannerUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                                  const base64 = await fileToBase64(file, 1200, 400);
                                  setTempBanner(base64);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <div className="relative group">
                          <input 
                            name="bannerUrl" 
                            value={tempBanner !== null ? tempBanner : config.bannerUrl} 
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
                          {(tempLogo !== null ? tempLogo : config.logoUrl) ? (
                            <img src={tempLogo !== null ? tempLogo : config.logoUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                            value={tempLogo !== null ? tempLogo : config.logoUrl} 
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAdminModal(false); setEditingAdmin(null); setIsAddingAdmin(false); setTempAdminPhoto(""); }} />
            <motion.div 
              initial={{ opacity: 0, y: 100, scale: 1 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 100, scale: 1 }} 
              className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                  {editingAdmin ? "Editar Administrador" : (isAddingAdmin ? "Novo Administrador" : "Gerenciar Administradores")}
                </h2>
                <button onClick={() => { setShowAdminModal(false); setEditingAdmin(null); setIsAddingAdmin(false); setTempAdminPhoto(""); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 dark:text-gray-500"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                {isAdmin?.canEditAdmins && !editingAdmin && !isAddingAdmin && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Administradores Atuais</p>
                      <button 
                        onClick={() => setIsAddingAdmin(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-blue-200 dark:shadow-none"
                      >
                        <Plus size={14} />
                        Novo
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {admins.map(admin => (
                        <div key={admin.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                              {admin.photo ? (
                                <img src={admin.photo} alt={admin.username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <UserIcon size={18} />
                              )}
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-200 text-sm md:text-base">{admin.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => {
                                setEditingAdmin(admin);
                                setTempAdminPhoto(admin.photo || "");
                              }}
                              className="text-blue-400 hover:text-blue-600 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeleteAdmin(admin.id)}
                              className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(isAddingAdmin || editingAdmin || !isAdmin?.canEditAdmins) && (
                  <form onSubmit={handleSaveAdmin} className="space-y-5 pt-2">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      {editingAdmin ? "Dados do Administrador" : (isAddingAdmin ? "Adicionar Novo Admin" : (!isAdmin?.canEditAdmins ? "Meu Perfil" : ""))}
                    </p>
                    
                    <div className="flex flex-col items-center gap-4 mb-6">
                      <div className="relative group">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:bg-blue-50/30">
                          {(tempAdminPhoto || (editingAdmin?.photo || (!isAdmin?.canEditAdmins ? isAdmin?.photo : ""))) ? (
                            <img src={tempAdminPhoto || editingAdmin?.photo || (!isAdmin?.canEditAdmins ? isAdmin?.photo : "")} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon size={32} strokeWidth={1.5} className="text-gray-300 dark:text-gray-600" />
                          )}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <Upload size={20} className="text-white" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const base64 = await fileToBase64(file);
                                  setTempAdminPhoto(base64);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                      <div className="w-full relative group">
                        <input 
                          name="photo" 
                          value={tempAdminPhoto || (editingAdmin?.photo || (!isAdmin?.canEditAdmins ? isAdmin?.photo : ""))} 
                          onChange={(e) => setTempAdminPhoto(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-xs font-medium text-gray-800 dark:text-gray-100" 
                          placeholder="Ou cole a URL da foto"
                        />
                        <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-600 transition-colors" size={16} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Usuário</label>
                        <input 
                          name="username" 
                          defaultValue={editingAdmin?.username || (!isAdmin?.canEditAdmins ? isAdmin?.username : "")}
                          required 
                          disabled={!isAdmin?.canEditAdmins}
                          className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100 disabled:opacity-50" 
                          placeholder="Nome de usuário"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Senha {(editingAdmin || !isAdmin?.canEditAdmins) && "(deixe em branco para manter)"}</label>
                        <input 
                          type="password" 
                          name="password" 
                          required={!editingAdmin && isAdmin?.canEditAdmins}
                          className="w-full px-4 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-sm md:text-base font-medium text-gray-800 dark:text-gray-100" 
                          placeholder={(editingAdmin || !isAdmin?.canEditAdmins) ? "Nova senha" : "Senha de acesso"}
                        />
                      </div>
                      {isAdmin?.canEditAdmins && (
                        <div className="flex items-center gap-3 p-3.5 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                          <input 
                            type="checkbox" 
                            name="canEditAdmins" 
                            id="canEditAdmins"
                            defaultChecked={editingAdmin?.canEditAdmins || false}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                          />
                          <label htmlFor="canEditAdmins" className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">
                            Pode gerenciar outros administradores
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="pt-2 flex flex-col gap-3">
                      <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm md:text-base flex items-center justify-center gap-2"
                      >
                        {(editingAdmin || !isAdmin?.canEditAdmins) ? <RefreshCw size={18} /> : <UserPlus size={18} />}
                        {editingAdmin ? "Salvar Alterações" : (isAddingAdmin ? "Criar Administrador" : (!isAdmin?.canEditAdmins ? "Salvar Alterações" : "Adicionar Administrador"))}
                      </button>
                      {(editingAdmin || isAddingAdmin) && isAdmin?.canEditAdmins && (
                        <button 
                          type="button"
                          onClick={() => { setEditingAdmin(null); setIsAddingAdmin(false); setTempAdminPhoto(""); }}
                          className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm md:text-base"
                        >
                          Voltar para Lista
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => { setShowAdminModal(false); setEditingAdmin(null); setIsAddingAdmin(false); setTempAdminPhoto(""); }}
                        className="w-full bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-sm md:text-base sm:hidden"
                      >
                        Fechar
                      </button>
                    </div>
                  </form>
                )}
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-center" richColors />
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
