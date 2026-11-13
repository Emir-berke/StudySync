// Mongo references can arrive as an id string, an { id } or { _id } object.
export function refId(value) {
  if (value && typeof value === 'object') return value.id ?? value._id ?? null
  return value ?? null
}

export function formatDateTime(iso) {
  if (!iso) return 'Not scheduled'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

// <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm" in local time.
export function toDateTimeLocal(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function toDateInput(iso) {
  return iso ? toDateTimeLocal(iso).slice(0, 10) : ''
}
