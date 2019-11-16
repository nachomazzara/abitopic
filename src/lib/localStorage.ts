const KEY_BASE = 'abitopic-'
const KEY_LAST_USED = `${KEY_BASE}last-used-`
const KEY_NETWORK = `${KEY_BASE}network`
const KEY_CONTRACT = `${KEY_LAST_USED}contract`

export type LastUsedContract = {
  address: string
  abi: any
  isProxy: boolean
}

export function saveLastUsedNetwork(network: string, index?: number) {
  window.localStorage.setItem(`${KEY_NETWORK}-${index || '0'}`, network)
}

export function getLastUsedNetwork(index?: number): string {
  const data = window.localStorage.getItem(`${KEY_NETWORK}-${index || '0'}`)
  return data ? data : 'mainnet'
}

export function saveLastUsedContract(options: LastUsedContract, index?: number) {
  window.localStorage.setItem(`${KEY_CONTRACT}-${index || '0'}`, JSON.stringify(options))
}

export function getLastUsedContract(index?: number): LastUsedContract | null {
  const data = window.localStorage.getItem(`${KEY_CONTRACT}-${index || '0'}`)
  return data ? JSON.parse(data) : {}
}
