import { describe, it, expect, vi, beforeEach } from "vitest";

import { calendarRepository } from "../calendar.repository";
import { calendarService } from "../calendar.service";

vi.mock("../calendar.repository", () => ({
  calendarRepository: { listEvents: vi.fn() },
}));

const query = { from: "2026-07-01T00:00:00.000Z", to: "2026-07-31T23:59:59.999Z" };

beforeEach(() => vi.clearAllMocks());

describe("calendarService.listEvents", () => {
  it("returns an empty array when there are no hearings or important dates in range", async () => {
    vi.mocked(calendarRepository.listEvents).mockResolvedValue({
      hearings: [],
      importantDates: [],
    } as never);

    const result = await calendarService.listEvents("org-1", query);

    expect(result).toEqual([]);
  });

  it("tags hearings and important dates with their kind, flattens case fields, and sorts by date", async () => {
    vi.mocked(calendarRepository.listEvents).mockResolvedValue({
      hearings: [
        {
          id: "hearing-1",
          caseId: "case-1",
          date: new Date("2026-07-15T05:00:00.000Z"),
          time: "10:00",
          purpose: "ARGUMENTS",
          status: "SCHEDULED",
          case: { id: "case-1", title: "State vs Sharma", courtName: "Delhi High Court" },
        },
      ],
      importantDates: [
        {
          id: "date-1",
          caseId: "case-2",
          dateType: "LIMITATION",
          date: new Date("2026-07-10T05:00:00.000Z"),
          description: "Appeal window closes",
          case: { id: "case-2", title: "Verma Trust" },
        },
      ],
    } as never);

    const result = await calendarService.listEvents("org-1", query);

    expect(result).toEqual([
      {
        kind: "important-date",
        id: "date-1",
        caseId: "case-2",
        caseTitle: "Verma Trust",
        date: "2026-07-10T05:00:00.000Z",
        dateType: "LIMITATION",
        description: "Appeal window closes",
      },
      {
        kind: "hearing",
        id: "hearing-1",
        caseId: "case-1",
        caseTitle: "State vs Sharma",
        courtName: "Delhi High Court",
        date: "2026-07-15T05:00:00.000Z",
        time: "10:00",
        purpose: "ARGUMENTS",
        status: "SCHEDULED",
      },
    ]);
  });
});
