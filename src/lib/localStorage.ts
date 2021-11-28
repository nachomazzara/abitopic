const KEY_BASE = 'abitopic-'
const KEY_LAST_USED = `${KEY_BASE}last-used-`
const KEY_NETWORK = `${KEY_BASE}network`
const KEY_CONTRACT = `${KEY_LAST_USED}contract`
const KEY_CODE = `${KEY_LAST_USED}code`

export type LastUsedContract = {
  address: string
  abi: any
  isProxy: boolean
}

function getKey(key: string, index?: number) {
  return `${key}-${index || '0'}`
}

export function saveLastUsedNetwork(network: string, index?: number) {
  window.localStorage.setItem(getKey(KEY_NETWORK, index), network)
}

export function getLastUsedNetwork(index?: number): string {
  const data = window.localStorage.getItem(getKey(KEY_NETWORK, index))
  return data ? data : 'mainnet'
}

export function saveLastUsedContract(
  options: LastUsedContract,
  index?: number
) {
  window.localStorage.setItem(
    getKey(KEY_CONTRACT, index),
    JSON.stringify(options)
  )
}

export function getLastUsedContract(index?: number): LastUsedContract | null {
  const data = window.localStorage.getItem(getKey(KEY_CONTRACT, index))
  return data ? JSON.parse(data) : {}
}

export function saveLastUsedCode(code: string, index?: number) {
  window.localStorage.setItem(getKey(KEY_CODE, index), code)
}

export function getLastUsedCode(index?: number): string | null {
  const data = window.localStorage.getItem(getKey(KEY_CODE, index))
  return data ? data : null
}
