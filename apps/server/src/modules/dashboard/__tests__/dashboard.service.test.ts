import { beforeEach, describe, expect, it, vi } from "vitest";

import { dashboardRepository } from "../dashboard.repository";
import { dashboardService } from "../dashboard.service";

vi.mock("../dashboard.repository", () => ({
  dashboardRepository: { getData: vi.fn() },
}));

const mockData = {
  stats: { activeCases: 5, hearingsToday: 2, hearingsThisWeek: 8, upcomingDeadlines: 3 },
  upcomingHearings:  [],
  upcomingDeadlines: [],
  highPriorityCases: [],
};

beforeEach(() => vi.clearAllMocks());

describe("dashboardService.getData", () => {
  it("delegates to repository with orgId", async () => {
    vi.mocked(dashboardRepository.getData).mockResolvedValue(mockData as never);
    const result = await dashboardService.getData("org-1");
    expect(result).toEqual(mockData);
    expect(dashboardRepository.getData).toHaveBeenCalledWith("org-1");
  });
});
