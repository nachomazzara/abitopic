export type Type = { type: string; name: string }

export type TransactionProps = {
  funcName: string
  inputs: Type[]
  outputs: Type[]
  isConstant: boolean
  contract: any
  blockNumber: string
}
export type TransactionState = {
  data: string
  link: string
  error: string | null
}

export interface EthereumWindow {
  ethereum?: {
    _metamask: { isApproved: () => Promise<boolean> }
    isApproved: () => Promise<boolean>

    enable?: () => Promise<string[]>

    autoRefreshOnNetworkChange: boolean
  }
  web3?: any
}
