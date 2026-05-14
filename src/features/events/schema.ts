import { z } from "zod"

const dateRegex = /^\d{4}-\d{2}-\d{2}$/
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const colorRegex = /^#[0-9a-fA-F]{6}$/

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().max(5000).optional(),
    date: z.string().regex(dateRegex, "Invalid date"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    allDay: z.boolean(),
    color: z.string().regex(colorRegex, "Use a #RRGGBB hex color").optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    if (values.allDay) return
    if (!values.startTime || !timeRegex.test(values.startTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time is required",
      })
    }
    if (!values.endTime || !timeRegex.test(values.endTime)) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time is required",
      })
    }
    if (
      values.startTime &&
      values.endTime &&
      timeRegex.test(values.startTime) &&
      timeRegex.test(values.endTime) &&
      values.endTime <= values.startTime
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End must be after start",
      })
    }
  })

export type EventFormValues = z.infer<typeof eventFormSchema>
