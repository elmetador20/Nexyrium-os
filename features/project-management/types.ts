export type ProjectServiceType =
  | "Pitch Deck"
  | "Financial Model"
  | "Business Plan"
  | "Investor Outreach"
  | "Grant Proposal"
  | "Fundraising Strategy"
  | "Custom";

export type ProjectPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type ProjectStatus =
  | "Received"
  | "Research"
  | "Content Writing"
  | "Design"
  | "QA"
  | "Client Review"
  | "Revision"
  | "Completed"
  | "Cancelled";

export type TaskStatus =
  | "To Do"
  | "In Progress"
  | "Waiting"
  | "Review"
  | "Completed"
  | "Blocked";

export interface ProfileSimple {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  roleName?: string;
}

export interface Project {
  id: string;
  name: string;
  startup_name: string;
  client_id: string | null;
  client?: ProfileSimple | null;
  service_type: ProjectServiceType;
  priority: ProjectPriority;
  status: ProjectStatus;
  progress: number;
  deadline: string;
  description: string;
  project_manager_id: string | null;
  project_manager?: ProfileSimple | null;
  researcher_id: string | null;
  researcher?: ProfileSimple | null;
  content_writer_id: string | null;
  content_writer?: ProfileSimple | null;
  designer_id: string | null;
  designer?: ProfileSimple | null;
  qa_id: string | null;
  qa?: ProfileSimple | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string;
  department: string;
  assigned_user_id: string | null;
  assigned_user?: ProfileSimple | null;
  priority: ProjectPriority;
  status: TaskStatus;
  estimated_hours: number;
  deadline: string | null;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

export interface ResearchRecord {
  id: string;
  project_id: string;
  industry: string;
  competitors: string;
  target_audience: string;
  pain_points: string;
  market_size: string;
  tam: string;
  sam: string;
  som: string;
  references: string;
  documents: { name: string; url: string }[];
  assigned_researcher_id: string | null;
  updated_at: string;
}

export interface ContentRecord {
  id: string;
  project_id: string;
  assigned_writer_id: string | null;
  slide_progress: number;
  google_docs_link: string;
  version_history: { version: string; date: string; author: string }[];
  approval_status: "PENDING" | "APPROVED" | "REJECTED_REVISION";
  slides: { title: string; notes: string; status: string }[];
  updated_at: string;
}

export interface DesignRecord {
  id: string;
  project_id: string;
  assigned_designer_id: string | null;
  canva_link: string;
  brand_kit: {
    logo: string;
    fonts: string;
    colors: string[];
    icons: string;
    illustrations: string;
  };
  pdf_export_url: string;
  pptx_export_url: string;
  approval_status: "PENDING" | "APPROVED" | "REJECTED_REVISION";
  updated_at: string;
}

export interface QARecord {
  id: string;
  project_id: string;
  assigned_qa_id: string | null;
  checklist: {
    grammar: boolean;
    alignment: boolean;
    typography: boolean;
    charts: boolean;
    icons: boolean;
    images: boolean;
    consistency: boolean;
    brandCompliance: boolean;
    storyFlow: boolean;
  };
  status: "PENDING" | "APPROVED" | "REJECTED_REVISION";
  comments: string;
  updated_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  name: string;
  status: string;
  version: string;
  owner_id: string;
  deadline: string | null;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  file_url: string;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  user?: ProfileSimple | null;
  content: string;
  emoji_reactions?: Record<string, string[]>;
  attachments?: string[];
  created_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  user_id: string;
  event: string;
  details: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  project_name?: string;
  client_id: string;
  client_name?: string;
  amount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  issued_at: string;
  due_at: string;
  line_items: { description: string; amount: number }[];
}

export interface EmployeeWorkload {
  userId: string;
  fullName: string;
  email: string;
  roleName: string;
  activeProjectsCount: number;
  activeTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  efficiency: number; // percentage
  avgCompletionDays: number;
  capacityLoad: number; // percentage
  isOverloaded: boolean;
}

export interface ProjectDashboardData {
  projects: Project[];
  tasks: Task[];
  recentActivities: TimelineEvent[];
  stats: {
    totalProjects: number;
    activeProjects: number;
    projectsDueToday: number;
    delayedProjects: number;
    completedThisWeek: number;
    averageDeliveryTime: string;
    waitingForResearch: number;
    waitingForContent: number;
    waitingForDesign: number;
    waitingForQA: number;
    waitingForReview: number;
    revisionCount: number;
  };
}
