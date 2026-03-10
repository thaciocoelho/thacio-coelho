
export enum EmployeeStatus {
  ACTIVE = 'Ativo',
  INACTIVE = 'Inativo'
}

export enum AssignmentStatus {
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado',
  RESCHEDULED = 'Reagendado',
  PENDING = 'Pendente'
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  admissionDate: string;
  status: EmployeeStatus;
  notes: string;
  password?: string;
}

export interface Assignment {
  employeeId: string;
  serviceType: string;
  status: AssignmentStatus;
  time?: string;
  location?: string;
  justification?: string;
  description?: string;
  confirmedByAdmin?: boolean;
}

export interface ScaleItem {
  id: string;
  date: string; // ISO format YYYY-MM-DD
  assignments: Assignment[];
}

export interface Absence {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  justified: boolean;
}

export enum WarningType {
  VERBAL = 'Verbal',
  WRITTEN = 'Escrita',
  SUSPENSION = 'Suspensão'
}

export interface Warning {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  type: WarningType;
}

export type ViewTab = 'dashboard' | 'employees' | 'scale' | 'services' | 'absences' | 'warnings' | 'reports';
export type UserRole = 'admin' | 'employee';

export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface AppNotification {
  id: string;
  employeeId?: string; // If null, it's for everyone or admin
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'service' | 'warning' | 'warning_removal' | 'service_confirmed';
  targetTab?: ViewTab;
  targetDate?: string;
}
