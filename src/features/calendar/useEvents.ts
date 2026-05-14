import { useQuery } from "@tanstack/react-query"
import { and, asc, gte, isNull, lt } from "drizzle-orm"

import { db } from "@/db/client"
import { events, type EventRow } from "@/db/schema"

function eventsQueryKey(rangeStart: Date, rangeEnd: Date) {
  return ["events", rangeStart.getTime(), rangeEnd.getTime()] as const
}

export function useEvents(rangeStart: Date, rangeEnd: Date) {
  return useQuery<EventRow[]>({
    queryKey: eventsQueryKey(rangeStart, rangeEnd),
    queryFn: async () => {
      const startMs = rangeStart.getTime()
      const endMs = rangeEnd.getTime()
      return db
        .select()
        .from(events)
        .where(and(gte(events.endAt, startMs), lt(events.startAt, endMs), isNull(events.deletedAt)))
        .orderBy(asc(events.startAt))
    },
  })
}
