import { UpdateCaseInput } from "./cases.schema";

export function didJudgeChange(
  input: Pick<UpdateCaseInput, "judgeName" | "judgeDesignation">,
  existing: { judgeName: string | null; judgeDesignation: string | null },
): boolean {
  return (
    (input.judgeName !== undefined && input.judgeName !== existing.judgeName) ||
    (input.judgeDesignation !== undefined &&
      input.judgeDesignation !== existing.judgeDesignation)
  );
}
