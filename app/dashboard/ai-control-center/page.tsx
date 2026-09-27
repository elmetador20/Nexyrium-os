import { serverRequireRole } from "@/features/project-management/utils/server-guard";
import { AIControlCenter } from "@/features/ai-agent/components/ai-control-center";

export const dynamic = "force-dynamic";

export default async function AIControlCenterPage() {
  await serverRequireRole(["SUPER_ADMIN", "CEO", "OPERATIONS_MANAGER", "PROJECT_MANAGER"]);
  return <AIControlCenter />;
}
