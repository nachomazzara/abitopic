import { Contract } from 'web3-eth-contract/types'

export type Type = { type: string; name: string }

export type TransactionProps = {
  funcName: string
  inputs: Type[]
  outputs: Type[]
  contract: Contract
  blockNumber: string
  isConstant: boolean
  isPayable: boolean
}
export type TransactionState = {
  data: string
  link: string
  error: string | null
}

export type TxData = {
  data: string
  value: string
}

export interface EthereumWindow {
  ethereum?: {
    _metamask: { isApproved: () => Promise<boolean> }
    isApproved: () => Promise<boolean>

    enable?: () => Promise<string[]>

    autoRefreshOnNetworkChange: boolean
  }
}

