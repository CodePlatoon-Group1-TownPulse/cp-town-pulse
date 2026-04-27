export function pad2(n) {
  return n < 10 ? `0${n}` : String(n)
}

export function buildYmd(year, monthIdx, day) {
  return `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`
}

export function toYmd(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return ''
  return dateStr.slice(0, 10)
}

export function formatDateMDY(value) {
  const ymd = toYmd(value)
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-')
  if (!y || !m || !d) return ''
  return `${m}/${d}/${y}`
}