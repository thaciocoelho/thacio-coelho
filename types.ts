
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
}

export interface Assignment {
  employeeId: string;
  serviceType: string;
  status: AssignmentStatus;
  justification?: string;
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

export type PeriodFilter = 'daily' | 'weekly' | 'monthly' | 'custom';
