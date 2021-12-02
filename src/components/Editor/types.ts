import { Contract } from 'web3-eth-contract/types'

export type State = {
  code: string
  output: string | null
  error: string | null
  isRunning: boolean
  showEditor: boolean
  copyText: string
}

export type Props = {
  contract: Contract | null
  index: number
}
