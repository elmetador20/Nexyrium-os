export interface Role {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";
  role_id: string | null;
  role: Role | null;
  department?: string;
  last_login?: string;
  created_at: string;
  updated_at?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  totalClients: number;
  activeProjects: number;
  projectsDueToday: number;
  projectsDelayed: number;
  revenueThisMonth: number;
  pendingPayments: number;
  pendingUserApprovals: number;
  totalEmployees: number;
  avgCompletionTime: string;
  teamUtilization: number;
  monthlyRevenue: { month: string; amount: number }[];
  projectStatusDistribution: { name: string; value: number; color: string }[];
  departmentProductivity: { name: string; value: number }[];
  recentActivities: ActivityLog[];
}

export interface SystemSettings {
  companyName: string;
  logoUrl: string;
  timezone: string;
  currency: string;
  theme: "dark" | "light" | "system";
  allowPublicSignup: boolean;
  requireMfa: boolean;
}
