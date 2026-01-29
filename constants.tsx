
import { Employee, EmployeeStatus, WarningType, Absence, Warning, ScaleItem } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'João Silva', position: 'Supervisor', admissionDate: '2023-01-15', status: EmployeeStatus.ACTIVE, notes: 'Funcionário exemplar' },
  { id: '2', name: 'Maria Santos', position: 'Operador', admissionDate: '2023-03-10', status: EmployeeStatus.ACTIVE, notes: '' },
  { id: '3', name: 'Pedro Souza', position: 'Analista', admissionDate: '2023-06-20', status: EmployeeStatus.ACTIVE, notes: '' },
  { id: '4', name: 'Ana Oliveira', position: 'Operador', admissionDate: '2023-08-05', status: EmployeeStatus.INACTIVE, notes: 'Desligamento voluntário' },
];

export const INITIAL_SCALE: ScaleItem[] = [
  { id: 's1', date: new Date().toISOString().split('T')[0], employeeIds: ['1', '2'] },
  { id: 's2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], employeeIds: ['1', '3'] },
];

export const INITIAL_ABSENCES: Absence[] = [
  { id: 'a1', employeeId: '2', date: '2024-05-10', reason: 'Médico', justified: true },
];

export const INITIAL_WARNINGS: Warning[] = [
  { id: 'w1', employeeId: '3', date: '2024-05-12', reason: 'Atraso recorrente', type: WarningType.VERBAL },
];
