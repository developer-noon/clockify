export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  task_id?: string;
  description?: string;
  date: string;
  hours: number;
  price_per_hour: number;
  is_billable: boolean;
  created_at: string;
}

export interface ReportSummary {
  total_hours: number;
  total_amount: number;
  by_client: Array<{
    id: string;
    hours: number;
    amount: number;
    name: string;
  }>;
  by_project: Array<{
    id: string;
    hours: number;
    amount: number;
    name: string;
  }>;
}

export interface SharedReport {
  client_name: string;
  start_date?: string | null;
  end_date?: string | null;
  total_hours: number;
  total_amount: number;
  by_project: Array<{
    id: string;
    hours: number;
    amount: number;
    name: string;
  }>;
  entries: Array<{
    date: string;
    project: string;
    task?: string;
    description?: string;
    hours: number;
    rate: number;
    total: number;
  }>;
}
