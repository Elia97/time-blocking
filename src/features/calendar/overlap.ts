export type OverlapInput = {
  id: string
  startAt: number
  endAt: number
}

export type OverlapPosition = {
  column: number
  totalColumns: number
}

export function layoutOverlaps(events: readonly OverlapInput[]): Map<string, OverlapPosition> {
  const result = new Map<string, OverlapPosition>()
  if (events.length === 0) return result

  const sorted = [...events].sort((a, b) => a.startAt - b.startAt || b.endAt - a.endAt)

  let cluster: OverlapInput[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    const columns: number[] = [] // last end per column
    const colOf = new Map<string, number>()
    for (const ev of cluster) {
      let placed = -1
      for (let i = 0; i < columns.length; i++) {
        if (columns[i] <= ev.startAt) {
          columns[i] = ev.endAt
          placed = i
          break
        }
      }
      if (placed === -1) {
        columns.push(ev.endAt)
        placed = columns.length - 1
      }
      colOf.set(ev.id, placed)
    }
    const total = columns.length
    for (const ev of cluster) {
      result.set(ev.id, { column: colOf.get(ev.id)!, totalColumns: total })
    }
    cluster = []
    clusterEnd = -Infinity
  }

  for (const ev of sorted) {
    if (ev.startAt >= clusterEnd) {
      flush()
    }
    cluster.push(ev)
    if (ev.endAt > clusterEnd) clusterEnd = ev.endAt
  }
  flush()

  return result
}
