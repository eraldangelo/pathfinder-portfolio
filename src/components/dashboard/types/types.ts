import type { ReactNode } from 'react';

export interface FunnelData {
  totalLeads: string;
  genuineStudents: string;
  applications: string;
  offers: string;
  coe: string;
  lodged: string;
  granted: string;
  refused: string;
}

export interface TrendPoint {
  month: string;
  rate: number;
  granted: number;
  refused: number;
  lodged: number;
}

export type TrendData = {
  [key: string]: TrendPoint[];
};

export interface Reminder {
  assigned: string;
  text: string;
  due: string;
  icon: ReactNode;
  color: string;
}
