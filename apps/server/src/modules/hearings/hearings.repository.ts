import { HearingStatus, ImportantDateType } from "@splexa-group/shared/enums";

import { prisma } from "@/db/client";
import {
  hearingDetailSelect,
  hearingSummarySelect,
} from "@/db/selects/hearing.select";
import { casesRepository } from "@/modules/cases/cases.repository";

import { CreateHearingInput, UpdateHearingInput } from "./hearings.schema";

export const hearingsRepository = {
  async create(
    data: CreateHearingInput & {
      caseId: string;
      orgId: string;
      addedBy: string;
      notifyUserId: string;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const status = data.status ?? HearingStatus.SCHEDULED;

      const hearing = await tx.hearing.create({
        data: {
          caseId: data.caseId,
          orgId: data.orgId,
          date: data.date,
          time: data.time,
          purpose: data.purpose,
          notes: data.notes,
          judgeName: data.judgeName,
          addedBy: data.addedBy,
          status,
        },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(data.caseId, data.orgId, tx);

      if (status === HearingStatus.SCHEDULED) {
        await tx.importantDate.create({
          data: {
            caseId: data.caseId,
            orgId: data.orgId,
            dateType: ImportantDateType.HEARING_DATE,
            date: data.date,
            sourceId: hearing.id,
            notifyUserId: data.notifyUserId,
          },
        });
      }

      return hearing;
    });
  },

  async findById(id: string, orgId: string) {
    return prisma.hearing.findFirst({
      where: { id, orgId, deletedAt: null },
      select: hearingDetailSelect,
    });
  },

  async findByCaseId(caseId: string, orgId: string) {
    return prisma.hearing.findMany({
      where: { caseId, orgId, deletedAt: null },
      select: hearingSummarySelect,
      orderBy: { date: "desc" },
    });
  },

  async update(
    id: string,
    caseId: string,
    orgId: string,
    data: UpdateHearingInput,
  ) {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.hearing.updateMany({
        where: { id, orgId, deletedAt: null },
        data: {
          status: data.status,
          notes: data.notes,
          date: data.date,
          time: data.time !== undefined ? data.time || null : undefined,
          nextDate: data.nextDate,
          adjournmentReason: data.adjournmentReason,
          judgeName: data.judgeName,
          purpose: data.purpose,
        },
      });

      if (count === 0) return null;

      const updated = await tx.hearing.findFirstOrThrow({
        where: { id, orgId, deletedAt: null },
        select: hearingSummarySelect,
      });

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      const isTerminal =
        data.status === HearingStatus.CANCELLED ||
        data.status === HearingStatus.COMPLETED;

      if (isTerminal) {
        // Terminal status — no more reminders needed for this hearing
        await tx.importantDate.updateMany({
          where: { sourceId: id, orgId, deletedAt: null },
          data: { deletedAt: new Date() },
        });
      } else {
        // Hearing rescheduled (date) or adjourned to a new date (nextDate) — keep the
        // reminder's date in sync. nextDate wins if both are somehow present, since it's
        // the more specific "this is when it's actually happening next" signal.
        const newReminderDate = data.nextDate ?? data.date;
        if (newReminderDate) {
          await tx.importantDate.updateMany({
            where: {
              sourceId: id,
              orgId,
              dateType: ImportantDateType.HEARING_DATE,
              deletedAt: null,
            },
            data: { date: newReminderDate },
          });
        }
      }

      return updated;
    });
  },

  async softDelete(
    id: string,
    caseId: string,
    orgId: string,
  ): Promise<{ count: number }> {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.hearing.updateMany({
        where: { id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (count === 0) return { count };

      await casesRepository.updateNextHearingDate(caseId, orgId, tx);

      await tx.importantDate.updateMany({
        where: { sourceId: id, orgId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      return { count };
    });
  },
};
