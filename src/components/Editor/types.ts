import { Contract } from 'web3-eth-contract/types'

export type State = {
  code: string
  output: string | null
}

export type Props = {
  contract: Contract | null
}