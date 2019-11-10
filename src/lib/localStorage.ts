const KEY_BASE = 'abitopic-'
const KEY_LAST_USED = `${KEY_BASE}last-used`

export type LastUsed = {
  network: string
  address: string
  abi: any
  isProxy: boolean
}

export function saveLastUsed(options: LastUsed) {
  window.localStorage.setItem(KEY_LAST_USED, JSON.stringify(options))
}

export function getLastUsed(): LastUsed | null {
  const data = window.localStorage.getItem(KEY_LAST_USED)
  return data ? JSON.parse(data) : {}
}
