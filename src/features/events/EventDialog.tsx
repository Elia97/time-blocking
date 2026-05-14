import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useEventDialog, type EventDialogState } from "@/stores/eventDialogStore"
import { EventDialogForm } from "./EventDialogForm"

function dialogKey(state: NonNullable<EventDialogState>): string {
  if (state.mode === "edit") {
    return `edit-${state.event.id}`
  }
  const startAt = state.defaults?.startAt
  if (startAt === undefined) {
    return "create-now"
  }
  return `create-${startAt}`
}

export function EventDialog() {
  const dialogState = useEventDialog((s) => s.dialogState)
  const closeDialog = useEventDialog((s) => s.closeDialog)

  return (
    <Dialog open={dialogState !== null} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        {dialogState && <EventDialogForm key={dialogKey(dialogState)} state={dialogState} />}
      </DialogContent>
    </Dialog>
  )
}
