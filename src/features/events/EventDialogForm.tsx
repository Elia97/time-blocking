import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { EventRow } from "@/db/schema"
import { useEventDialog, type EventDialogState } from "@/stores/eventDialogStore"
import { eventUpdateFromForm, newEventFromForm } from "./factories"
import { useCreateEvent, useDeleteEvent, useUpdateEvent } from "./mutations"
import { eventFormSchema, type EventFormValues } from "./schema"
import { defaultFormValues, eventToFormValues } from "./transforms"

export function EventDialogForm({ state }: { state: NonNullable<EventDialogState> }) {
  const closeDialog = useEventDialog((s) => s.closeDialog)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const deleteEvent = useDeleteEvent()

  const initialValues =
    state.mode === "edit" ? eventToFormValues(state.event) : defaultFormValues(state.defaults)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
    mode: "onSubmit",
  })

  const allDay = useWatch({ control: form.control, name: "allDay" })
  useEffect(() => {
    if (allDay) {
      form.setValue("startTime", "")
      form.setValue("endTime", "")
    } else if (!form.getValues("startTime") && !form.getValues("endTime")) {
      const fallback = defaultFormValues()
      form.setValue("startTime", fallback.startTime)
      form.setValue("endTime", fallback.endTime)
    }
  }, [allDay, form])

  const onSubmit = form.handleSubmit(async (values) => {
    if (state.mode === "create") {
      await createEvent.mutateAsync(newEventFromForm(values))
    } else {
      await updateEvent.mutateAsync({ id: state.event.id, patch: eventUpdateFromForm(values) })
    }
    closeDialog()
  })

  const onDelete = async (event: EventRow) => {
    await deleteEvent.mutateAsync({ id: event.id })
    closeDialog()
  }

  const isSubmitting = createEvent.isPending || updateEvent.isPending || deleteEvent.isPending

  return (
    <>
      <DialogHeader>
        <DialogTitle>{state.mode === "create" ? "New event" : "Edit event"}</DialogTitle>
        <DialogDescription>
          {state.mode === "create"
            ? "Block time on your calendar."
            : "Update the event details below."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="What's the plan?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allDay"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <FormLabel className="text-sm">All day</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start</FormLabel>
                    <FormControl>
                      <Input type="time" step={900} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End</FormLabel>
                    <FormControl>
                      <Input type="time" step={900} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input
                    type="color"
                    className="h-9 w-16 p-1"
                    value={field.value || "#3b82f6"}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Optional context" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="gap-2 sm:justify-between">
            {state.mode === "edit" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(state.event)}
                disabled={isSubmitting}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {state.mode === "create" ? "Create" : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  )
}
