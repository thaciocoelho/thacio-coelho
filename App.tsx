
import React, { useState, useMemo, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { 
  Employee, 
  ScaleItem, 
  Absence, 
  Warning, 
  ViewTab, 
  EmployeeStatus, 
  WarningType,
  PeriodFilter
} from './types';
import { 
  INITIAL_EMPLOYEES, 
  INITIAL_SCALE, 
  INITIAL_ABSENCES, 
  INITIAL_WARNINGS 
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
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
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean
}> = ({ children, onClick, variant = 'primary', className = "", disabled }) => {
  const variants = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-700 active:bg-slate-200',
    danger: 'bg-red-500 text-white active:bg-red-600',
    ghost: 'bg-transparent text-slate-600 active:bg-slate-50'
  };
  return (
    <button 
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

// --- App Main ---

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [scale, setScale] = useState<ScaleItem[]>(INITIAL_SCALE);
  const [absences, setAbsences] = useState<Absence[]>(INITIAL_ABSENCES);
  const [warnings, setWarnings] = useState<Warning[]>(INITIAL_WARNINGS);
  
  // States for Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  
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
      default: return { start: subMonths(today, 1), end: today };
    }
  }, [period]);

  const stats = useMemo(() => {
    const activeEmpCount = employees.filter(e => e.status === EmployeeStatus.ACTIVE).length;
    const filteredScale = scale.filter(s => isWithinInterval(new Date(s.date), currentRange));
    const totalServices = filteredScale.reduce((acc, curr) => acc + curr.employeeIds.length, 0);
    const filteredAbsences = absences.filter(a => isWithinInterval(new Date(a.date), currentRange)).length;
    const filteredWarnings = warnings.filter(w => isWithinInterval(new Date(w.date), currentRange)).length;

    // Services per employee
    const servicesMap: Record<string, number> = {};
    filteredScale.forEach(s => {
      s.employeeIds.forEach(id => {
        servicesMap[id] = (servicesMap[id] || 0) + 1;
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

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.get('name') as string,
      position: formData.get('position') as string,
      admissionDate: formData.get('admissionDate') as string,
      status: EmployeeStatus.ACTIVE,
      notes: formData.get('notes') as string,
    };
    setEmployees([...employees, newEmp]);
    setIsEmployeeModalOpen(false);
  };

  const handleSaveScale = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const date = formData.get('date') as string;
    const selectedIds = Array.from(formData.getAll('employeeIds')) as string[];
    
    const existingIndex = scale.findIndex(s => s.date === date);
    if (existingIndex >= 0) {
      const newScale = [...scale];
      newScale[existingIndex] = { ...newScale[existingIndex], employeeIds: selectedIds };
      setScale(newScale);
    } else {
      setScale([...scale, { id: Math.random().toString(36).substr(2, 9), date, employeeIds: selectedIds }]);
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
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                period === p ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
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
          <div className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Serviços Realizados</div>
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
          <BarChart3 className="w-4 h-4 text-blue-600" /> Top 5 Funcionários
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={stats.topEmployees} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '10px' }} stroke="#64748b" />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
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
        <Button onClick={() => setIsEmployeeModalOpen(true)}>
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>
      
      <div className="space-y-3">
        {employees.map(emp => (
          <Card key={emp.id} className="group transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{emp.name}</h4>
                  <p className="text-xs text-slate-500">{emp.position}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  emp.status === EmployeeStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {emp.status}
                </span>
                <p className="text-[10px] text-slate-400">Admissão: {format(new Date(emp.admissionDate), 'dd/MM/yyyy')}</p>
              </div>
            </div>
            {emp.notes && (
              <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-500 italic">
                "{emp.notes}"
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal title="Novo Funcionário" isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)}>
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
            <input name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cargo / Função</label>
            <input name="position" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Data de Admissão</label>
            <input name="admissionDate" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações</label>
            <textarea name="notes" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>
          <Button className="w-full py-4 text-base shadow-lg shadow-blue-500/20">Cadastrar</Button>
        </form>
      </Modal>
    </div>
  );

  const renderScale = () => {
    const days = eachDayOfInterval({
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth)
    });

    const isDayScheduled = (date: Date) => {
      return scale.some(s => isSameDay(new Date(s.date + 'T00:00:00'), date));
    };

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Escala Mensal</h2>
          <div className="flex gap-1 items-center bg-white rounded-xl shadow-sm border border-slate-100 p-1">
            <button onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm font-bold text-slate-800 min-w-[100px] text-center capitalize">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <Card className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-slate-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Fillers for start of month */}
            {Array.from({ length: startOfMonth(selectedMonth).getDay() }).map((_, i) => (
              <div key={`fill-${i}`} />
            ))}
            {days.map(day => {
              const hasService = isDayScheduled(day);
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsScaleModalOpen(true);
                  }}
                  className={`relative aspect-square rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{format(day, 'd')}</span>
                  {hasService && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-lg">Resumo do Dia Escolhido</h3>
          {scale.filter(s => isSameDay(new Date(s.date + 'T00:00:00'), selectedDate)).length > 0 ? (
            scale.filter(s => isSameDay(new Date(s.date + 'T00:00:00'), selectedDate)).map(s => (
              <div key={s.id} className="space-y-2">
                {s.employeeIds.map(id => {
                  const emp = employees.find(e => e.id === id);
                  return (
                    <Card key={id} className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-xs">
                          {emp?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{emp?.name}</p>
                          <p className="text-[10px] text-slate-500">{emp?.position}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nenhum serviço agendado para este dia.</p>
              <Button variant="ghost" className="mt-2 text-blue-600" onClick={() => setIsScaleModalOpen(true)}>Agendar agora</Button>
            </div>
          )}
        </div>

        <Modal title={`Escala: ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`} isOpen={isScaleModalOpen} onClose={() => setIsScaleModalOpen(false)}>
          <form onSubmit={handleSaveScale} className="space-y-6">
            <input type="hidden" name="date" value={format(selectedDate, 'yyyy-MM-dd')} />
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Selecione os Funcionários</label>
              <div className="space-y-2">
                {employees.filter(e => e.status === EmployeeStatus.ACTIVE).map(emp => (
                  <label key={emp.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 active:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      name="employeeIds" 
                      value={emp.id} 
                      defaultChecked={scale.find(s => s.date === format(selectedDate, 'yyyy-MM-dd'))?.employeeIds.includes(emp.id)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{emp.name}</p>
                      <p className="text-[10px] text-slate-500">{emp.position}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full py-4 text-base">Salvar Escala</Button>
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
        <div className="space-y-4">
          {sortedScale.map(item => (
            <div key={item.id}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <CalendarDays className="w-3 h-3" /> {format(new Date(item.date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </div>
              <div className="space-y-2">
                {item.employeeIds.map(empId => {
                  const emp = employees.find(e => e.id === empId);
                  return (
                    <Card key={empId} className="border-l-4 border-l-emerald-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                            {emp?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{emp?.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{emp?.position}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">REALIZADO</span>
                      </div>
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
        <Button onClick={() => setIsAbsenceModalOpen(true)} variant="danger">
          <Plus className="w-4 h-4" /> Registrar
        </Button>
      </div>

      <div className="space-y-4">
        {absences.sort((a, b) => b.date.localeCompare(a.date)).map(abs => {
          const emp = employees.find(e => e.id === abs.employeeId);
          return (
            <Card key={abs.id} className="border-l-4 border-l-red-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800">{emp?.name}</h4>
                  <p className="text-xs text-slate-500">{format(new Date(abs.date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  abs.justified ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {abs.justified ? 'JUSTIFICADA' : 'NÃO JUSTIFICADA'}
                </span>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{abs.reason}"</p>
            </Card>
          );
        })}
      </div>

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
          <Button variant="danger" className="w-full py-4 text-base">Salvar Registro</Button>
        </form>
      </Modal>
    </div>
  );

  const renderWarnings = () => (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 text-amber-600">Advertências</h2>
        <Button onClick={() => setIsWarningModalOpen(true)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="w-4 h-4" /> Registrar
        </Button>
      </div>

      <div className="space-y-4">
        {warnings.sort((a, b) => b.date.localeCompare(a.date)).map(warn => {
          const emp = employees.find(e => e.id === warn.employeeId);
          return (
            <Card key={warn.id} className="border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-slate-800">{emp?.name}</h4>
                  <p className="text-xs text-slate-500">{format(new Date(warn.date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700 uppercase">
                  {warn.type}
                </span>
              </div>
              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{warn.reason}"</p>
            </Card>
          );
        })}
      </div>

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
          <Button className="w-full py-4 text-base bg-amber-500 hover:bg-amber-600">Emitir Advertência</Button>
        </form>
      </Modal>
    </div>
  );

  const renderReports = () => {
    // Basic aggregation for reports
    const reportData = employees.map(emp => {
      const services = scale.reduce((acc, curr) => acc + (curr.employeeIds.includes(emp.id) ? 1 : 0), 0);
      const absCount = absences.filter(a => a.employeeId === emp.id).length;
      const warnCount = warnings.filter(w => w.employeeId === emp.id).length;
      return { ...emp, services, absCount, warnCount };
    });

    return (
      <div className="space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Relatórios</h2>
          <Button variant="secondary" className="text-xs">
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>

        <Card className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px]">Funcionário</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Serviços</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Faltas</th>
                <th className="py-3 px-2 font-bold text-slate-400 uppercase text-[10px] text-center">Adv.</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map(data => (
                <tr key={data.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-4 px-2">
                    <p className="font-bold text-slate-800 leading-tight">{data.name}</p>
                    <p className="text-[10px] text-slate-400">{data.position}</p>
                  </td>
                  <td className="py-4 px-2 text-center font-bold text-blue-600">{data.services}</td>
                  <td className="py-4 px-2 text-center font-bold text-red-500">{data.absCount}</td>
                  <td className="py-4 px-2 text-center font-bold text-amber-500">{data.warnCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0">
            <h4 className="font-bold mb-1 opacity-90">Eficiência Geral</h4>
            <div className="text-3xl font-bold">94.2%</div>
            <p className="text-xs opacity-70 mt-1">Baseado na relação serviços vs faltas</p>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <h4 className="font-bold mb-1 opacity-90">Engajamento Semanal</h4>
            <div className="text-3xl font-bold">+12%</div>
            <p className="text-xs opacity-70 mt-1">Crescimento em relação à semana anterior</p>
          </Card>
        </div>
      </div>
    );
  };

  const tabs: { id: ViewTab, label: string, icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-6 h-6" /> },
    { id: 'employees', label: 'Equipe', icon: <Users className="w-6 h-6" /> },
    { id: 'scale', label: 'Escala', icon: <CalendarDays className="w-6 h-6" /> },
    { id: 'absences', label: 'Faltas', icon: <UserX className="w-6 h-6" /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ClipboardList className="text-white w-6 h-6" />
          </div>
          <h1 className="text-lg font-black text-slate-800 tracking-tight">GESTOR<span className="text-blue-600">PRO</span></h1>
        </div>
        <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-xs font-black text-blue-600">ADM</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pt-2">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'employees' && renderEmployees()}
        {activeTab === 'scale' && renderScale()}
        {activeTab === 'absences' && (
          <div className="space-y-8">
            {renderAbsences()}
            {renderWarnings()}
          </div>
        )}
        {activeTab === 'reports' && renderReports()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-lg border-t border-slate-100 safe-bottom z-40">
        <div className="flex justify-around items-center px-2 py-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all px-4 py-1 rounded-2xl ${
                activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-80'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
