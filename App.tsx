import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  AlertTriangle, 
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Trash2,
  Camera,
  Film,
  Scissors,
  Plane,
  PlayCircle,
  MinusCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  PieChart as PieChartIcon,
  AlignLeft,
  UserPlus,
  Filter
} from 'lucide-react';
import { 
  Employee, 
  ScaleItem, 
  Absence, 
  Warning, 
  ViewTab, 
  EmployeeStatus, 
  WarningType,
  PeriodFilter,
  Assignment,
  AssignmentStatus
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_SCALE, 
  INITIAL_ABSENCES, 
  INITIAL_WARNINGS,
  SERVICE_TYPES
} from './constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  isWithinInterval, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek,
  startOfYear,
  endOfYear
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Storage Configuration ---
const STORAGE_PREFIX = 'servitrack_v1_';
const OLD_PREFIX = 'gpro_';

const KEYS = {
  EMPLOYEES: 'employees',
  SCALE: 'scale',
  ABSENCES: 'absences',
  WARNINGS: 'warnings',
  SERVICES: 'services'
};

interface FormAssignment extends Assignment {
  tempId: string;
}

// --- Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-4 ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit'
}> = ({ children, onClick, variant = 'primary', className = "", disabled, type = 'button' }) => {
  const variants = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-700 active:bg-slate-200',
    danger: 'bg-red-500 text-white active:bg-red-600',
    warning: 'bg-amber-500 text-white active:bg-amber-600',
    ghost: 'bg-transparent text-slate-600 active:bg-slate-50'
  };
  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Modal: React.FC<{ title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Plus className="w-6 h-6 rotate-45 text-slate-400" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

const getServiceIcon = (service: string) => {
  switch (service) {
    case 'Fotos': return <Camera className="w-4 h-4" />;
    case 'Vídeo sem edição': return <Film className="w-4 h-4" />;
    case 'Edição': return <Scissors className="w-4 h-4" />;
    case 'Vídeo Drone': return <Plane className="w-4 h-4" />;
    case 'Vídeo completo': return <PlayCircle className="w-4 h-4" />;
    case 'Nenhum serviço': return <MinusCircle className="w-4 h-4 text-slate-400" />;
    default: return <ClipboardList className="w-4 h-4" />;
  }
};

const StatusBadge: React.FC<{ status: AssignmentStatus }> = ({ status }) => {
  const styles = {
    [AssignmentStatus.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    [AssignmentStatus.CANCELLED]: 'bg-red-50 text-red-600 border-red-100',
    [AssignmentStatus.RESCHEDULED]: 'bg-amber-50 text-amber-600 border-amber-100',
    [AssignmentStatus.PENDING]: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  const Icons = {
    [AssignmentStatus.COMPLETED]: <CheckCircle2 className="w-3 h-3" />,
    [AssignmentStatus.CANCELLED]: <XCircle className="w-3 h-3" />,
    [AssignmentStatus.RESCHEDULED]: <RefreshCw className="w-3 h-3" />,
    [AssignmentStatus.PENDING]: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full uppercase ${styles[status]}`}>
      {Icons[status]} {status}
    </span>
  );
};

// --- App Main ---

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  
  // Persistence Helper
  const getStoredData = <T,>(key: string, defaultValue: T): T => {
    try {
      const currentKey = `${STORAGE_PREFIX}${key}`;
      const oldKey = `${OLD_PREFIX}${key}`;
      const saved = localStorage.getItem(currentKey);
      if (saved) return JSON.parse(saved);
      const oldSaved = localStorage.getItem(oldKey);
      if (oldSaved) {
        const data = JSON.parse(oldSaved);
        localStorage.setItem(currentKey, oldSaved);
        return data;
      }
      return defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from storage`, e);
      return defaultValue;
    }
  };

  const [employees, setEmployees] = useState<Employee[]>(() => getStoredData(KEYS.EMPLOYEES, INITIAL_EMPLOYEES));
  const [scale, setScale] = useState<ScaleItem[]>(() => getStoredData(KEYS.SCALE, INITIAL_SCALE));
  const [absences, setAbsences] = useState<Absence[]>(() => getStoredData(KEYS.ABSENCES, INITIAL_ABSENCES));
  const [warnings, setWarnings] = useState<Warning[]>(() => getStoredData(KEYS.WARNINGS, INITIAL_WARNINGS));
  const [services, setServices] = useState<string[]>(() => getStoredData(KEYS.SERVICES, SERVICE_TYPES));

  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}${KEYS.EMPLOYEES}`, JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}${KEYS.SCALE}`, JSON.stringify(scale)); }, [scale]);
  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}${KEYS.ABSENCES}`, JSON.stringify(absences)); }, [absences]);
  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}${KEYS.WARNINGS}`, JSON.stringify(warnings)); }, [warnings]);
  useEffect(() => { localStorage.setItem(`${STORAGE_PREFIX}${KEYS.SERVICES}`, JSON.stringify(services)); }, [services]);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  
  // Updated Scale Form State: Array of assignments
  const [assignmentRows, setAssignmentRows] = useState<FormAssignment[]>([]);

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [period, setPeriod] = useState<PeriodFilter>('monthly');

  // Filter for Services tab
  const [serviceStatusFilter, setServiceStatusFilter] = useState<AssignmentStatus | 'all'>('all');

  const currentRange = useMemo(() => {
    const today = new Date();
    switch (period) {
      case 'daily': return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly': return { start: startOfWeek(today, { weekStartsOn: 0 }), end: endOfWeek(today, { weekStartsOn: 0 }) };
      case 'monthly': return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'yearly': return { start: startOfYear(today), end: endOfYear(today) };
      default: return { start: addMonths(today, -1), end: today };
    }
  }, [period]);

  const stats = useMemo(() => {
    const activeEmpCount = employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
    const filteredScale = scale.filter(s => isWithinInterval(new Date(s.date + 'T12:00:00'), currentRange));
    const totalServices = filteredScale.reduce((acc, curr) => 
      acc + curr.assignments.filter(a => a.serviceType !== 'Nenhum serviço' && a.status === AssignmentStatus.COMPLETED).length, 0);
    const filteredAbsences = absences.filter(a => isWithinInterval(new Date(a.date + 'T12:00:00'), currentRange)).length;
    const filteredWarnings = warnings.filter(w => isWithinInterval(new Date(w.date + 'T12:00:00'), currentRange)).length;

    const servicesMap: Record<string, number> = {};
    filteredScale.forEach(s => {
      s.assignments.forEach(asg => {
        if (asg.serviceType !== 'Nenhum serviço' && asg.status === AssignmentStatus.COMPLETED) {
          servicesMap[asg.employeeId] = (servicesMap[asg.employeeId] || 0) + 1;
        }
      });
    });

    const topEmployees = Object.entries(servicesMap)
      .map(([id, count]) => ({
        name: employees.find(e => e.id === id)?.name || 'N/A',
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { activeEmpCount, totalServices, filteredAbsences, filteredWarnings, topEmployees, totalWorkDays: filteredScale.length };
  }, [employees, scale, absences, warnings, currentRange]);

  const [newServiceName, setNewServiceName] = useState('');

  const handleAddService = () => {
    const trimmed = newServiceName.trim();
    if (trimmed && !services.includes(trimmed)) {
      setServices(prev => [...prev, trimmed]);
      setNewServiceName('');
    }
  };

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeData = {
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      admissionDate: formData.get('admissionDate') as string,
      status: (formData.get('status') as EmployeeStatus) || EmployeeStatus.ACTIVE,
      notes: formData.get('notes') as string,
    };
    if (editingEmployee) {
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? { ...emp, ...employeeData } : emp));
    } else {
      const newEmp: Employee = { id: Math.random().toString(36).substr(2, 9), ...employeeData };
      setEmployees(prev => [...prev, newEmp]);
    }
    setIsEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Deseja realmente excluir este funcionário?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const openScaleModal = () => {
    // Bring history: Find existing assignments for the selected date
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existingDayScale = scale.find(s => s.date === dateStr);
    
    if (existingDayScale && existingDayScale.assignments.length > 0) {
      // Map existing assignments to form rows with tempIds
      setAssignmentRows(existingDayScale.assignments.map(asg => ({
        ...asg,
        tempId: Math.random().toString(36).substr(2, 9)
      })));
    } else {
      // If no history, start with one clean default row
      const firstActiveId = employees.find(e => e.status === EmployeeStatus.ACTIVE)?.id || employees[0]?.id || '';
      setAssignmentRows([{
        tempId: Math.random().toString(36).substr(2, 9),
        employeeId: firstActiveId,
        serviceType: 'Fotos',
        status: AssignmentStatus.PENDING,
        justification: '',
        description: ''
      }]);
    }
    setIsScaleModalOpen(true);
  };

  const addAssignmentRow = () => {
    const firstActiveId = employees.find(e => e.status === EmployeeStatus.ACTIVE)?.id || employees[0]?.id || '';
    setAssignmentRows(prev => [...prev, {
      tempId: Math.random().toString(36).substr(2, 9),
      employeeId: firstActiveId,
      serviceType: 'Fotos',
      status: AssignmentStatus.PENDING,
      justification: '',
      description: ''
    }]);
  };

  const updateAssignmentRow = (tempId: string, updates: Partial<FormAssignment>) => {
    setAssignmentRows(prev => prev.map(row => row.tempId === tempId ? { ...row, ...updates } : row));
  };

  const removeAssignmentRow = (tempId: string) => {
    setAssignmentRows(prev => prev.filter(row => row.tempId !== tempId));
  };

  const handleSaveScale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const date = format(selectedDate, 'yyyy-MM-dd');
    
    const finalAssignments: Assignment[] = assignmentRows.map(({ tempId, ...rest }) => ({
      ...rest,
      ...(rest.serviceType === 'Nenhum serviço' ? { status: AssignmentStatus.PENDING, justification: '', description: '' } : {})
    }));
    
    setScale(prev => {
      const existingIndex = prev.findIndex(s => s.date === date);
      if (existingIndex >= 0) {
        const newScale = [...prev];
        newScale[existingIndex] = { ...newScale[existingIndex], assignments: finalAssignments };
        return newScale;
      } else {
        return [...prev, { id: Math.random().toString(36).substr(2, 9), date, assignments: finalAssignments }];
      }
    });
    setIsScaleModalOpen(false);
  };

  const handleAddAbsence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAbs: Absence = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: formData.get('employeeId') as string,
      date: formData.get('date') as string,
      reason: formData.get('reason') as string,
      justified: formData.get('justified') === 'on'
    };
    setAbsences(prev => [...prev, newAbs]);
    setIsAbsenceModalOpen(false);
  };

  const handleAddWarning = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newWarn: Warning = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: formData.get('employeeId') as string,
      date: formData.get('date') as string,
      reason: formData.get('reason') as string,
      type: formData.get('type') as WarningType
    };
    setWarnings(prev => [...prev, newWarn]);
    setIsWarningModalOpen(false);
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Resumo Geral</h2>
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          {(['daily', 'weekly', 'monthly', 'yearly'] as PeriodFilter[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Funcionários</div>
          <div className="text-2xl font-bold text-slate-800">{stats.activeEmpCount}</div>
          <div className="mt-2 text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full w-fit">Ativos agora</div>
        </Card>
        <Card className="flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Concluídos</div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalServices}</div>
          <div className="mt-2 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full w-fit">No período</div>
        </Card>
        <Card className="flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Faltas</div>
          <div className="text-2xl font-bold text-slate-800">{stats.filteredAbsences}</div>
          <div className="mt-2 text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full w-fit">Registradas</div>
        </Card>
        <Card className="flex flex-col justify-between border-l-4 border-l-red-500">
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Advertências</div>
          <div className="text-2xl font-bold text-slate-800">{stats.filteredWarnings}</div>
          <div className="mt-2 text-[10px] text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full w-fit">Emitidas</div>
        </Card>
      </div>
      <Card className="h-[300px]">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" /> Eficiência de Serviços
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={stats.topEmployees} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} stroke="#64748b" />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {stats.topEmployees.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  const renderEmployees = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Funcionários</h2>
        <Button onClick={() => { setEditingEmployee(null); setIsEmployeeModalOpen(true); }}><Plus className="w-4 h-4" /> Novo</Button>
      </div>
      <div className="space-y-3">
        {employees.map(emp => (
          <Card key={emp.id} className="group transition-all hover:shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg">{emp.name.charAt(0)}</div>
                <div><h4 className="font-bold text-slate-800">{emp.name}</h4><p className="text-xs text-slate-500">{emp.position}</p></div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${emp.status === EmployeeStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{emp.status}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEditEmployee(emp)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderScale = () => {
    const days = eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) });
    const currentDayScale = scale.filter(s => isSameDay(new Date(s.date + 'T12:00:00'), selectedDate));

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Escala Mensal</h2>
          <div className="flex gap-1 items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
            <span className="text-sm font-bold text-slate-800 min-w-[100px] text-center capitalize">{format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (<div key={i} className="text-center text-[10px] font-bold text-slate-400">{d}</div>))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: startOfMonth(selectedMonth).getDay() }).map((_, i) => (<div key={`fill-${i}`} />))}
            {days.map(day => {
              const hasService = scale.some(s => isSameDay(new Date(s.date + 'T12:00:00'), day));
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                  <span className="text-xs font-bold">{format(day, 'd')}</span>
                  {hasService && !isSelected && (<div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />)}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg">Serviços do Dia</h3>
            <Button onClick={openScaleModal} className="px-3 py-1.5 text-xs shadow-md shadow-emerald-500/10" variant="primary">
              <Plus className="w-3.5 h-3.5" /> Adicionar / Editar
            </Button>
          </div>
          <div className="text-xs font-medium text-slate-400 mb-2">{format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}</div>

          {currentDayScale.length > 0 ? (
            currentDayScale.map(s => (
              <div key={s.id} className="space-y-2">
                {s.assignments.map((asg, idx) => {
                  const emp = employees.find(e => e.id === asg.employeeId);
                  const isNoService = asg.serviceType === 'Nenhum serviço';
                  return (
                    <Card key={`${asg.employeeId}-${idx}`} className={`py-3 border-l-4 ${isNoService ? 'border-l-slate-300' : 'border-l-blue-500'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isNoService ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                            {getServiceIcon(asg.serviceType)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{emp?.name}</p>
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isNoService ? 'text-slate-400' : 'text-blue-600'}`}>{asg.serviceType}</p>
                          </div>
                        </div>
                        {!isNoService && <StatusBadge status={asg.status} />}
                      </div>
                      {asg.description && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
                          <AlignLeft className="w-3 h-3 mt-0.5 shrink-0 opacity-50" />
                          <p className="leading-relaxed">{asg.description}</p>
                        </div>
                      )}
                      {asg.justification && (
                        <div className="mt-2 text-[10px] text-red-500 bg-red-50/50 p-2 rounded-lg italic border border-red-100">
                          Justificativa: {asg.justification}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nenhum serviço agendado.</p>
            </div>
          )}
        </div>

        <Modal title={`Agendar: ${format(selectedDate, "dd/MM/yyyy")}`} isOpen={isScaleModalOpen} onClose={() => setIsScaleModalOpen(false)}>
          <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
            <label className="block text-[10px] font-bold text-blue-600 uppercase mb-2">Cadastrar Novo Tipo de Serviço</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Ex: Drone FPV, Social Media..."
                className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Button 
                onClick={handleAddService}
                className="py-2 px-4 text-xs h-full"
                disabled={!newServiceName.trim()}
              >
                Cadastrar
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveScale} className="space-y-6">
            <div className="space-y-4">
              {assignmentRows.map((row) => {
                const isNoService = row.serviceType === 'Nenhum serviço';
                const showJustification = !isNoService && (row.status === AssignmentStatus.CANCELLED || row.status === AssignmentStatus.RESCHEDULED);

                return (
                  <div key={row.tempId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 transition-all relative">
                    <button 
                      type="button" 
                      onClick={() => removeAssignmentRow(row.tempId)}
                      className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Funcionário</label>
                        <select 
                          value={row.employeeId}
                          onChange={(e) => updateAssignmentRow(row.tempId, { employeeId: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          {employees.filter(e => e.status === EmployeeStatus.ACTIVE).map(e => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className={`grid ${!isNoService ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Serviço</label>
                          <select 
                            value={row.serviceType}
                            onChange={(e) => updateAssignmentRow(row.tempId, { serviceType: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                          >
                            {services.map(st => (<option key={st} value={st}>{st}</option>))}
                          </select>
                        </div>
                        {!isNoService && (
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                            <select 
                              value={row.status}
                              onChange={(e) => updateAssignmentRow(row.tempId, { status: e.target.value as AssignmentStatus })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                            >
                              {Object.values(AssignmentStatus).map(s => (<option key={s} value={s}>{s}</option>))}
                            </select>
                          </div>
                        )}
                      </div>
                      
                      {!isNoService && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição do Serviço</label>
                          <textarea 
                            value={row.description}
                            onChange={(e) => updateAssignmentRow(row.tempId, { description: e.target.value })}
                            placeholder="Ex: Evento XYZ, Ensaio ABC..."
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs h-16 resize-none"
                          />
                        </div>
                      )}

                      {showJustification && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 text-red-500">Justificativa</label>
                          <textarea 
                            required={showJustification}
                            value={row.justification}
                            onChange={(e) => updateAssignmentRow(row.tempId, { justification: e.target.value })}
                            placeholder="Motivo do cancelamento..."
                            className="w-full bg-white border border-red-200 rounded-xl px-3 py-2 text-xs h-16 resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <button 
                type="button" 
                onClick={addAssignmentRow}
                className="w-full border-2 border-dashed border-slate-200 rounded-2xl py-3 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Adicionar Outro Funcionário/Serviço
              </button>
            </div>
            
            <div className="sticky bottom-0 pt-4 bg-white">
              <Button type="submit" className="w-full py-4 text-base shadow-lg shadow-blue-500/20">Salvar Escala do Dia</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  };

  const renderServices = () => {
    const filteredScale = scale
      .map(item => ({
        ...item,
        assignments: item.assignments.filter(asg => {
          const isNotNone = asg.serviceType !== 'Nenhum serviço';
          const matchesStatus = serviceStatusFilter === 'all' || asg.status === serviceStatusFilter;
          return isNotNone && matchesStatus;
        })
      }))
      .filter(item => item.assignments.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    const filterOptions: { id: AssignmentStatus | 'all', label: string }[] = [
      { id: 'all', label: 'Todos' },
      { id: AssignmentStatus.COMPLETED, label: 'Concluídos' },
      { id: AssignmentStatus.PENDING, label: 'Pendentes' },
      { id: AssignmentStatus.CANCELLED, label: 'Cancelados' },
      { id: AssignmentStatus.RESCHEDULED, label: 'Reagendados' },
    ];

    return (
      <div className="space-y-6 pb-24">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-800">Controle de Serviços</h2>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-2 px-2">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setServiceStatusFilter(opt.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap shadow-sm ${
                  serviceStatusFilter === opt.id 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {filteredScale.length > 0 ? (
            filteredScale.map(item => (
              <div key={item.id}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CalendarDays className="w-3 h-3" /> {format(new Date(item.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </div>
                <div className="space-y-2">
                  {item.assignments.map((asg, idx) => {
                    const emp = employees.find(e => e.id === asg.employeeId);
                    return (
                      <Card key={`${asg.employeeId}-${idx}`} className={`border-l-4 ${asg.status === AssignmentStatus.COMPLETED ? 'border-l-emerald-500' : asg.status === AssignmentStatus.CANCELLED ? 'border-l-red-500' : asg.status === AssignmentStatus.RESCHEDULED ? 'border-l-amber-500' : 'border-l-slate-300'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-slate-50 text-slate-600`}>
                              {getServiceIcon(asg.serviceType)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{emp?.name}</p>
                              <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">{asg.serviceType}</p>
                            </div>
                          </div>
                          <StatusBadge status={asg.status} />
                        </div>
                        {asg.description && (
                          <div className="mt-2 text-[10px] text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100 flex items-start gap-1.5">
                            <AlignLeft className="w-3 h-3 mt-0.5 shrink-0 opacity-40" />
                            <p className="leading-relaxed">{asg.description}</p>
                          </div>
                        )}
                        {asg.justification && (
                          <p className="mt-2 text-[10px] text-red-500 italic px-2 py-1 bg-red-50/30 rounded border border-red-100">"{asg.justification}"</p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-2 opacity-50" />
              <p className="text-slate-400 text-sm">Nenhum serviço encontrado para este filtro.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAbsences = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 text-red-600">Faltas</h2>
        <Button onClick={() => setIsAbsenceModalOpen(true)} variant="danger"><Plus className="w-4 h-4" /> Registrar</Button>
      </div>
      <div className="space-y-4">
        {absences.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma falta registrada.</p>
        ) : (
          absences.sort((a, b) => b.date.localeCompare(a.date)).map(abs => {
            const emp = employees.find(e => e.id === abs.employeeId);
            return (
              <Card key={abs.id} className="border-l-4 border-l-red-500">
                <div className="flex justify-between items-start mb-2">
                  <div><h4 className="font-bold text-slate-800">{emp?.name}</h4><p className="text-xs text-slate-500">{format(new Date(abs.date + 'T12:00:00'), 'dd/MM/yyyy')}</p></div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${abs.justified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{abs.justified ? 'JUSTIFICADA' : 'NÃO JUSTIFICADA'}</span>
                </div>
                <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded-lg">"{abs.reason}"</p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderWarnings = () => (
    <div className="space-y-6 pt-6 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 text-amber-600">Advertências</h2>
        <Button onClick={() => setIsWarningModalOpen(true)} variant="warning"><Plus className="w-4 h-4" /> Registrar</Button>
      </div>
      <div className="space-y-4">
        {warnings.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma advertência registrada.</p>
        ) : (
          warnings.sort((a, b) => b.date.localeCompare(a.date)).map(warn => {
            const emp = employees.find(e => e.id === warn.employeeId);
            return (
              <Card key={warn.id} className="border-l-4 border-l-amber-500">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800">{emp?.name}</h4>
                    <p className="text-xs text-slate-500">{format(new Date(warn.date + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 uppercase">
                    {warn.type}
                  </span>
                </div>
                <p className="text-sm text-slate-600 italic bg-slate-50 p-2 rounded-lg">"{warn.reason}"</p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderReports = () => {
    const filteredScale = scale.filter(s => isWithinInterval(new Date(s.date + 'T12:00:00'), currentRange));
    const generalStats = {
      [AssignmentStatus.COMPLETED]: 0,
      [AssignmentStatus.CANCELLED]: 0,
      [AssignmentStatus.RESCHEDULED]: 0,
      [AssignmentStatus.PENDING]: 0,
    };
    
    filteredScale.forEach(s => {
      s.assignments.forEach(asg => {
        if (asg.serviceType !== 'Nenhum serviço') {
          generalStats[asg.status]++;
        }
      });
    });

    const reportData = employees.map(emp => {
      const services = filteredScale.reduce((acc, curr) => 
        acc + (curr.assignments.filter(a => a.employeeId === emp.id && a.status === AssignmentStatus.COMPLETED && a.serviceType !== 'Nenhum serviço').length), 0);
      const absCount = absences.filter(a => a.employeeId === emp.id && isWithinInterval(new Date(a.date + 'T12:00:00'), currentRange)).length;
      const warnCount = warnings.filter(w => w.employeeId === emp.id && isWithinInterval(new Date(w.date + 'T12:00:00'), currentRange)).length;
      return { ...emp, services, absCount, warnCount };
    });

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
          <Button variant="secondary" className="text-xs"><Download className="w-4 h-4" /> Exportar</Button>
        </div>

        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
          {(['weekly', 'monthly', 'yearly'] as PeriodFilter[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`flex-1 px-3 py-1.5 text-[10px] font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensal' : 'Anual'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-600" /> Relatório Geral de Serviços
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-l-4 border-l-emerald-500 p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Concluídos</div>
              <div className="text-xl font-black text-slate-800">{generalStats[AssignmentStatus.COMPLETED]}</div>
            </Card>
            <Card className="border-l-4 border-l-red-500 p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cancelados</div>
              <div className="text-xl font-black text-slate-800">{generalStats[AssignmentStatus.CANCELLED]}</div>
            </Card>
            <Card className="border-l-4 border-l-amber-500 p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Reagendados</div>
              <div className="text-xl font-black text-slate-800">{generalStats[AssignmentStatus.RESCHEDULED]}</div>
            </Card>
            <Card className="border-l-4 border-l-slate-400 p-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Pendentes</div>
              <div className="text-xl font-black text-slate-800">{generalStats[AssignmentStatus.PENDING]}</div>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Desempenho por Funcionário
          </h3>
          <Card className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px]">Equipe</th>
                  <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Concl.</th>
                  <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Faltas</th>
                  <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Adv.</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(data => (
                  <tr key={data.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-4 px-2">
                      <p className="font-bold text-slate-800 leading-tight truncate max-w-[80px]">{data.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{data.position}</p>
                    </td>
                    <td className="py-4 px-2 text-center font-bold text-emerald-600">{data.services}</td>
                    <td className="py-4 px-2 text-center font-bold text-red-500">{data.absCount}</td>
                    <td className="py-4 px-2 text-center font-bold text-amber-500">{data.warnCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    );
  };

  const tabs: { id: ViewTab, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'employees', label: 'Equipe', icon: <Users className="w-6 h-6" /> },
    { id: 'scale', label: 'Escala', icon: <CalendarDays className="w-6 h-6" /> },
    { id: 'services', label: 'Serviços', icon: <ClipboardList className="w-6 h-6" /> },
    { id: 'absences', label: 'Faltas/Adv', icon: <AlertTriangle className="w-6 h-6" /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"><ClipboardList className="text-white w-6 h-6" /></div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">Servi<span className="text-blue-600">Track</span></h1>
        </div>
      </header>
      <main className="flex-1 px-6 pt-2">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'scale' && renderScale()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'absences' && (
          <div className="space-y-8 pb-24">
            {renderAbsences()}
            {renderWarnings()}
          </div>
        )}
        {activeTab === 'reports' && renderReports()}
      </main>
      
      {/* Modals */}
      <Modal 
        title={editingEmployee ? "Editar Funcionário" : "Novo Funcionário"} 
        isOpen={isEmployeeModalOpen} 
        onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Nome Completo</label>
            <input 
              name="name" 
              defaultValue={editingEmployee?.name} 
              required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Cargo</label>
            <input 
              name="position" 
              defaultValue={editingEmployee?.position} 
              required 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Data Admissão</label>
              <input 
                name="admissionDate" 
                type="date" 
                defaultValue={editingEmployee?.admissionDate} 
                required 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
              <select 
                name="status" 
                defaultValue={editingEmployee?.status} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm"
              >
                {Object.values(EmployeeStatus).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Observações</label>
            <textarea 
              name="notes" 
              defaultValue={editingEmployee?.notes} 
              rows={3} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" 
            />
          </div>
          <Button type="submit" className="w-full py-4 text-base shadow-lg shadow-blue-500/20">
            {editingEmployee ? "Salvar Alterações" : "Cadastrar Funcionário"}
          </Button>
        </form>
      </Modal>

      <Modal title="Registrar Falta" isOpen={isAbsenceModalOpen} onClose={() => setIsAbsenceModalOpen(false)}>
        <form onSubmit={handleAddAbsence} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Funcionário</label>
            <select name="employeeId" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
            <input name="date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Motivo</label>
            <textarea name="reason" rows={2} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="justified" className="w-4 h-4 rounded border-slate-300" />
            <span className="text-sm font-medium text-slate-700">Falta Justificada?</span>
          </label>
          <Button type="submit" variant="danger" className="w-full py-4 text-base">Salvar Registro</Button>
        </form>
      </Modal>

      <Modal title="Registrar Advertência" isOpen={isWarningModalOpen} onClose={() => setIsWarningModalOpen(false)}>
        <form onSubmit={handleAddWarning} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Funcionário</label>
            <select name="employeeId" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
            <select name="type" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
              {Object.values(WarningType).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Data</label>
            <input name="date" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Motivo / Descrição</label>
            <textarea name="reason" rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <Button type="submit" variant="warning" className="w-full py-4 text-base">Emitir Advertência</Button>
        </form>
      </Modal>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 safe-bottom z-40">
        <div className="flex justify-around items-center px-1 py-3">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all px-2 py-1 rounded-xl ${activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
              <div className="transform scale-90">{tab.icon}</div>
              <span className={`text-[9px] font-bold truncate max-w-[56px] ${activeTab === tab.id ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
