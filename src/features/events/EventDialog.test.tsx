import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { useEventDialog } from "@/stores/eventDialogStore"
import { renderWithQueryClient } from "@/test/render"
import { EventDialog } from "./EventDialog"
import * as mutationsModule from "./mutations"

const FIXED_NOW = new Date(2026, 4, 14, 10, 0)

function stubMutations() {
  const mutateAsync = vi.fn().mockResolvedValue(undefined)
  vi.spyOn(mutationsModule, "useCreateEvent").mockReturnValue({
    mutateAsync,
    isPending: false,
  } as unknown as ReturnType<typeof mutationsModule.useCreateEvent>)
  vi.spyOn(mutationsModule, "useUpdateEvent").mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof mutationsModule.useUpdateEvent>)
  vi.spyOn(mutationsModule, "useDeleteEvent").mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof mutationsModule.useDeleteEvent>)
  return mutateAsync
}

describe("EventDialog", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(FIXED_NOW)
    useEventDialog.setState({ dialogState: null })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("is hidden when dialogState is null", () => {
    stubMutations()
    renderWithQueryClient(<EventDialog />)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("renders create mode with prefilled defaults", () => {
    stubMutations()
    useEventDialog.getState().openCreateDialog({
      startAt: new Date(2026, 4, 14, 14, 0).getTime(),
      endAt: new Date(2026, 4, 14, 14, 30).getTime(),
    })
    renderWithQueryClient(<EventDialog />)
    expect(screen.getByRole("heading", { name: "New event" })).toBeInTheDocument()
    expect(screen.getByLabelText("Date")).toHaveValue("2026-05-14")
    expect(screen.getByLabelText("Start")).toHaveValue("14:00")
    expect(screen.getByLabelText("End")).toHaveValue("14:30")
  })

  it("shows a validation error when title is empty on submit", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubMutations()
    useEventDialog.getState().openCreateDialog()
    renderWithQueryClient(<EventDialog />)

    await user.click(screen.getByRole("button", { name: "Create" }))
    expect(await screen.findByText("Title is required")).toBeInTheDocument()
  })

  it("submits a valid create form", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const mutateAsync = stubMutations()
    useEventDialog.getState().openCreateDialog({
      startAt: new Date(2026, 4, 14, 14, 0).getTime(),
      endAt: new Date(2026, 4, 14, 14, 30).getTime(),
    })
    renderWithQueryClient(<EventDialog />)

    await user.type(screen.getByLabelText("Title"), "Standup")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce())
    const row = mutateAsync.mock.calls[0][0] as { title: string; allDay: number }
    expect(row.title).toBe("Standup")
    expect(row.allDay).toBe(0)
    expect(useEventDialog.getState().dialogState).toBeNull()
  })

  it("renders edit mode with values prefilled from the event", () => {
    stubMutations()
    useEventDialog.getState().openEditDialog({
      id: "e1",
      title: "Standup",
      description: "Daily sync",
      startAt: new Date(2026, 4, 14, 9, 0).getTime(),
      endAt: new Date(2026, 4, 14, 9, 30).getTime(),
      allDay: 0,
      categoryId: null,
      color: null,
      notes: null,
      googleId: null,
      googleEtag: null,
      rrule: null,
      parentId: null,
      dirty: 0,
      deletedAt: null,
      createdAt: 0,
      updatedAt: 0,
    })
    renderWithQueryClient(<EventDialog />)
    expect(screen.getByRole("heading", { name: "Edit event" })).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("Standup")
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
  })

  it("uses a stable dialog key when create is opened without defaults", () => {
    stubMutations()
    useEventDialog.getState().openCreateDialog()
    renderWithQueryClient(<EventDialog />)
    expect(screen.getByRole("heading", { name: "New event" })).toBeInTheDocument()
  })

  it("uses a stable dialog key when defaults omit startAt", () => {
    stubMutations()
    useEventDialog.getState().openCreateDialog({ allDay: true })
    renderWithQueryClient(<EventDialog />)
    expect(screen.getByRole("heading", { name: "New event" })).toBeInTheDocument()
  })

  it("closes via onOpenChange when Escape is pressed", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubMutations()
    useEventDialog.getState().openCreateDialog()
    renderWithQueryClient(<EventDialog />)
    expect(useEventDialog.getState().dialogState).not.toBeNull()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(useEventDialog.getState().dialogState).toBeNull())
  })

  it("hides time inputs when All day is toggled on", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    stubMutations()
    useEventDialog.getState().openCreateDialog()
    renderWithQueryClient(<EventDialog />)

    expect(screen.getByLabelText("Start")).toBeInTheDocument()
    await user.click(screen.getByRole("switch", { name: /all day/i }))
    expect(screen.queryByLabelText("Start")).toBeNull()
  })
})
