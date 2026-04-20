export interface Stage {
  id: string;
  title: string;
  date?: string;
  completed: boolean;
  created_at: string;
}

export interface LogEntry {
  timestamp: string;
  kind: "comment" | "stage_add" | "stage_complete";
  content: string;
}

export interface NotificationRule {
  trigger: string;
  enabled: boolean;
}

export interface NomEvent {
  id: string;
  name: string;
  target_date: string;
  category: string;
  priority: string;
  created_at: string;
  notifications: NotificationRule[];
  stages: Stage[];
  log: LogEntry[];
}

export interface Category {
  name: string;
  color: string;
}

export interface Priority {
  name: string;
  color: string;
  order: number;
}

export interface Settings {
  categories: Category[];
  priorities: Priority[];
  default_notifications: NotificationRule[];
  backup_path?: string;
  last_backup?: string;
}
