
import { Employee, EmployeeStatus, WarningType, Absence, Warning, ScaleItem, AssignmentStatus } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'João Silva', position: 'Supervisor', admissionDate: '2023-01-15', status: EmployeeStatus.ACTIVE, notes: 'Funcionário exemplar' },
  { id: '2', name: 'Maria Santos', position: 'Operador', admissionDate: '2023-03-10', status: EmployeeStatus.ACTIVE, notes: '' },
  { id: '3', name: 'Pedro Souza', position: 'Analista', admissionDate: '2023-06-20', status: EmployeeStatus.ACTIVE, notes: '' },
  { id: '4', name: 'Ana Oliveira', position: 'Operador', admissionDate: '2023-08-05', status: EmployeeStatus.INACTIVE, notes: 'Desligamento voluntário' },
];

export const SERVICE_TYPES = [
  'Nenhum serviço',
  'Fotos',
  'Vídeo sem edição',
  'Edição',
  'Vídeo Drone',
  'Vídeo completo'
];

export const INITIAL_SCALE: ScaleItem[] = [
  { 
    id: 's1', 
    date: new Date().toISOString().split('T')[0], 
    assignments: [
      { employeeId: '1', serviceType: 'Fotos', status: AssignmentStatus.COMPLETED },
      { employeeId: '2', serviceType: 'Nenhum serviço', status: AssignmentStatus.PENDING }
    ] 
  },
  { 
    id: 's2', 
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], 
    assignments: [
      { employeeId: '1', serviceType: 'Edição', status: AssignmentStatus.COMPLETED },
      { employeeId: '3', serviceType: 'Vídeo Drone', status: AssignmentStatus.CANCELLED, justification: 'Cliente desistiu do projeto' }
    ] 
  },
];

export const INITIAL_ABSENCES: Absence[] = [
  { id: 'a1', employeeId: '2', date: '2024-05-10', reason: 'Médico', justified: true },
];

export const INITIAL_WARNINGS: Warning[] = [
  { id: 'w1', employeeId: '3', date: '2024-05-12', reason: 'Atraso recorrente', type: WarningType.VERBAL },
];
