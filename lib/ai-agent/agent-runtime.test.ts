import assert from "node:assert/strict";
import test from "node:test";
import { toAiSafeEmployeeWorkloads } from "./agent-runtime";
import type { EmployeeWorkload } from "@/features/project-management/types";

test("workload payload excludes internal user IDs before it reaches the model", () => {
  const internal: EmployeeWorkload[] = [{
    userId: "56c35ec5-4430-4f74-94dc-6a82c244d4ce",
    fullName: "Rohan",
    email: "rohan@example.com",
    roleName: "PROJECT_MANAGER",
    activeProjectsCount: 3,
    activeTasksCount: 8,
    completedTasksCount: 12,
    overdueTasksCount: 2,
    efficiency: 85,
    avgCompletionDays: 5.5,
    capacityLoad: 105,
    isOverloaded: true,
  }];

  const safe = toAiSafeEmployeeWorkloads(internal);

  assert.equal(internal[0].userId, "56c35ec5-4430-4f74-94dc-6a82c244d4ce");
  assert.deepEqual(safe, [{ fullName: "Rohan", roleName: "PROJECT_MANAGER", activeProjectsCount: 3, activeTasksCount: 8, completedTasksCount: 12, overdueTasksCount: 2, efficiency: 85, avgCompletionDays: 5.5, capacityLoad: 105, isOverloaded: true }]);
  assert.equal("userId" in safe[0], false);
  assert.equal("email" in safe[0], false);
});
