
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  UserX, 
  AlertTriangle, 
  BarChart3,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
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
  Clock
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [scale, setScale] = useState<ScaleItem[]>(INITIAL_SCALE);
  const [absences, setAbsences] = useState<Absence[]>(INITIAL_ABSENCES);
  const [warnings, setWarnings] = useState<Warning[]>(INITIAL_WARNINGS);
  
  // States for Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  
  // Form State for Assignments
  const [formAssignments, setFormAssignments] = useState<Record<string, { checked: boolean, serviceType: string, status: AssignmentStatus, justification: string }>>({});

  // Date states for Scale
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Period filters
  const [period, setPeriod] = useState<PeriodFilter>('monthly');

  // --- Derived Data ---

  const currentRange = useMemo(() => {
    const today = new Date();
    switch (period) {
      case 'daily': return { start: startOfDay(today), end: endOfDay(today) };
      case 'weekly': return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'monthly': return { start: startOfMonth(today), end: endOfMonth(today) };
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

  // --- Handlers ---

  const handleSaveEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employeeData = {
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      admissionDate: formData.get('admissionDate') as string,
      status: formData.get('status') as EmployeeStatus || EmployeeStatus.ACTIVE,
      notes: formData.get('notes') as string,
    };

    if (editingEmployee) {
      setEmployees(employees.map(emp => emp.id === editingEmployee.id ? { ...emp, ...employeeData } : emp));
    } else {
      const newEmp: Employee = { id: Math.random().toString(36).substr(2, 9), ...employeeData };
      setEmployees([...employees, newEmp]);
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
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const openScaleModal = () => {
    const existingScale = scale.find(s => s.date === format(selectedDate, 'yyyy-MM-dd'));
    const initialFormState: Record<string, { checked: boolean, serviceType: string, status: AssignmentStatus, justification: string }> = {};
    employees.forEach(emp => {
      const asg = existingScale?.assignments.find(a => a.employeeId === emp.id);
      initialFormState[emp.id] = {
        checked: !!asg,
        serviceType: asg?.serviceType || 'Nenhum serviço',
        status: asg?.status || AssignmentStatus.PENDING,
        justification: asg?.justification || ''
      };
    });
    setFormAssignments(initialFormState);
    setIsScaleModalOpen(true);
  };

  const handleSaveScale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const date = format(selectedDate, 'yyyy-MM-dd');
    const assignments: Assignment[] = (Object.entries(formAssignments) as [string, { checked: boolean, serviceType: string, status: AssignmentStatus, justification: string }][])
      .filter(([_, val]) => val.checked)
      .map(([empId, val]) => ({
        employeeId: empId,
        serviceType: val.serviceType,
        status: val.serviceType === 'Nenhum serviço' ? AssignmentStatus.PENDING : val.status,
        justification: val.serviceType === 'Nenhum serviço' ? '' : val.justification
      }));
    
    const existingIndex = scale.findIndex(s => s.date === date);
    if (existingIndex >= 0) {
      const newScale = [...scale];
      newScale[existingIndex] = { ...newScale[existingIndex], assignments };
      setScale(newScale);
    } else {
      setScale([...scale, { id: Math.random().toString(36).substr(2, 9), date, assignments }]);
    }
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
    setAbsences([...absences, newAbs]);
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
    setWarnings([...warnings, newWarn]);
    setIsWarningModalOpen(false);
  };

  // --- Render Functions ---

  const renderDashboard = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Resumo Geral</h2>
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
          {(['daily', 'weekly', 'monthly'] as PeriodFilter[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              {p === 'daily' ? 'Diário' : p === 'weekly' ? 'Semanal' : 'Mensal'}
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
      <Modal title={editingEmployee ? "Editar Funcionário" : "Novo Funcionário"} isOpen={isEmployeeModalOpen} onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }}>
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
            <input name="name" defaultValue={editingEmployee?.name} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cargo</label>
            <input name="position" defaultValue={editingEmployee?.position} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data Admissão</label>
            <input name="admissionDate" type="date" defaultValue={editingEmployee?.admissionDate} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" />
          </div>
          <Button type="submit" className="w-full py-4 text-base">{editingEmployee ? "Salvar Alterações" : "Cadastrar"}</Button>
        </form>
      </Modal>
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
                {s.assignments.map(asg => {
                  const emp = employees.find(e => e.id === asg.employeeId);
                  const isNoService = asg.serviceType === 'Nenhum serviço';
                  return (
                    <Card key={asg.employeeId} className={`py-3 border-l-4 ${isNoService ? 'border-l-slate-300' : 'border-l-blue-500'}`}>
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
                      {asg.justification && (
                        <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded-lg italic">
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
          <form onSubmit={handleSaveScale} className="space-y-6">
            <div className="space-y-4">
              {employees.filter(e => e.status === EmployeeStatus.ACTIVE).map(emp => {
                const val = formAssignments[emp.id] || { checked: false, serviceType: 'Nenhum serviço', status: AssignmentStatus.PENDING, justification: '' };
                const isNoService = val.serviceType === 'Nenhum serviço';
                const showJustification = !isNoService && (val.status === AssignmentStatus.CANCELLED || val.status === AssignmentStatus.RESCHEDULED);

                return (
                  <div key={emp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 transition-all">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={val.checked}
                        onChange={(e) => setFormAssignments({ ...formAssignments, [emp.id]: { ...val, checked: e.target.checked }})}
                        className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                        <span className="text-[10px] text-slate-500">{emp.position}</span>
                      </div>
                    </div>
                    {val.checked && (
                      <div className="pl-8 space-y-3">
                        <div className={`grid ${!isNoService ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Serviço</label>
                            <select 
                              value={val.serviceType}
                              onChange={(e) => setFormAssignments({ ...formAssignments, [emp.id]: { ...val, serviceType: e.target.value }})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                            >
                              {SERVICE_TYPES.map(st => (<option key={st} value={st}>{st}</option>))}
                            </select>
                          </div>
                          {!isNoService && (
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                              <select 
                                value={val.status}
                                onChange={(e) => setFormAssignments({ ...formAssignments, [emp.id]: { ...val, status: e.target.value as AssignmentStatus }})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                              >
                                {Object.values(AssignmentStatus).map(s => (<option key={s} value={s}>{s}</option>))}
                              </select>
                            </div>
                          )}
                        </div>
                        {showJustification && (
                          <div className="animate-in fade-in zoom-in-95 duration-200">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Justificativa</label>
                            <textarea 
                              required={showJustification}
                              value={val.justification}
                              onChange={(e) => setFormAssignments({ ...formAssignments, [emp.id]: { ...val, justification: e.target.value }})}
                              placeholder="Motivo do cancelamento ou reagendamento..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs h-16 resize-none"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <Button type="submit" className="w-full py-4 text-base shadow-lg shadow-blue-500/20">Salvar Alterações</Button>
          </form>
        </Modal>
      </div>
    );
  };

  const renderServices = () => {
    const sortedScale = [...scale].sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="space-y-6 pb-24">
        <h2 className="text-2xl font-bold text-slate-800">Controle de Serviços</h2>
        <div className="space-y-6">
          {sortedScale.map(item => (
            <div key={item.id}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <CalendarDays className="w-3 h-3" /> {format(new Date(item.date + 'T12:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </div>
              <div className="space-y-2">
                {item.assignments.map(asg => {
                  const emp = employees.find(e => e.id === asg.employeeId);
                  const isNoService = asg.serviceType === 'Nenhum serviço';
                  return (
                    <Card key={asg.employeeId} className={`border-l-4 ${asg.status === AssignmentStatus.COMPLETED ? 'border-l-emerald-500' : asg.status === AssignmentStatus.CANCELLED ? 'border-l-red-500' : asg.status === AssignmentStatus.RESCHEDULED ? 'border-l-amber-500' : 'border-l-slate-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isNoService ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                            {getServiceIcon(asg.serviceType)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{emp?.name}</p>
                            <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">{asg.serviceType}</p>
                          </div>
                        </div>
                        {!isNoService && <StatusBadge status={asg.status} />}
                      </div>
                      {asg.justification && (
                        <p className="mt-2 text-[10px] text-slate-500 italic px-2 py-1 bg-slate-50 rounded border border-slate-100">"{asg.justification}"</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAbsences = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 text-red-600">Faltas</h2>
        <Button onClick={() => setIsAbsenceModalOpen(true)} variant="danger"><Plus className="w-4 h-4" /> Registrar</Button>
      </div>
      <div className="space-y-4">
        {absences.sort((a, b) => b.date.localeCompare(a.date)).map(abs => {
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
        })}
      </div>
    </div>
  );

  const renderReports = () => {
    const reportData = employees.map(emp => {
      const services = scale.reduce((acc, curr) => acc + (curr.assignments.some(a => a.employeeId === emp.id && a.status === AssignmentStatus.COMPLETED && a.serviceType !== 'Nenhum serviço') ? 1 : 0), 0);
      const absCount = absences.filter(a => a.employeeId === emp.id).length;
      const warnCount = warnings.filter(w => w.employeeId === emp.id).length;
      return { ...emp, services, absCount, warnCount };
    });

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
          <Button variant="secondary" className="text-xs"><Download className="w-4 h-4" /> Exportar</Button>
        </div>
        <Card className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px]">Funcionário</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Concluídos</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Faltas</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(data => (
                <tr key={data.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-4 px-2">
                    <p className="font-bold text-slate-800 leading-tight">{data.name}</p>
                    <p className="text-[10px] text-slate-400">{data.position}</p>
                  </td>
                  <td className="py-4 px-2 text-center font-bold text-emerald-600">{data.services}</td>
                  <td className="py-4 px-2 text-center font-bold text-red-500">{data.absCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  };

  const tabs: { id: ViewTab, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'employees', label: 'Equipe', icon: <Users className="w-6 h-6" /> },
    { id: 'scale', label: 'Escala', icon: <CalendarDays className="w-6 h-6" /> },
    { id: 'services', label: 'Serviços', icon: <ClipboardList className="w-6 h-6" /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30"><ClipboardList className="text-white w-6 h-6" /></div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">GESTOR<span className="text-blue-600">PRO</span></h1>
        </div>
      </header>
      <main className="flex-1 px-6 pt-2">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'scale' && renderScale()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'reports' && renderReports()}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 safe-bottom z-40">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all px-4 py-1 rounded-2xl ${activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab.icon}<span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-80'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
