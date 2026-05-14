import { beforeEach, describe, expect, it } from "vitest"

import { useEventDialog } from "./eventDialogStore"

describe("eventDialogStore", () => {
  beforeEach(() => {
    useEventDialog.setState({ dialogState: null })
  })

  it("opens with create defaults", () => {
    useEventDialog.getState().openCreateDialog({ startAt: 1000, endAt: 2000 })
    expect(useEventDialog.getState().dialogState).toEqual({
      mode: "create",
      defaults: { startAt: 1000, endAt: 2000 },
    })
  })

  it("opens with an event in edit mode", () => {
    const event = { id: "e1", title: "Foo" } as never
    useEventDialog.getState().openEditDialog(event)
    expect(useEventDialog.getState().dialogState).toEqual({ mode: "edit", event })
  })

  it("closeDialog resets to null", () => {
    useEventDialog.getState().openCreateDialog({ startAt: 0, endAt: 0 })
    useEventDialog.getState().closeDialog()
    expect(useEventDialog.getState().dialogState).toBeNull()
  })
})
