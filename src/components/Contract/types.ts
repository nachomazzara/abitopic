import { Contract } from 'web3-eth-contract'

import { Event as EventType } from '../../components/Event/types' // @TODO: components as paths
import { Func } from '../../components/Function/types' // @TODO: components as paths
import { ReactElement } from 'react'

export type State = {
  contract: Contract | null
  address: string
  abi: any
  originalABI: any
  events: EventType[] | null
  functions: Func[] | null
  error: string | ReactElement<HTMLElement> | null
  activeTab: string
  isProxy: boolean
  search: string
  blockNumber: string
  isLoading: boolean
  contractName: string
}

export type Props = {
  network: string
  apiNetwork: string
  index: number
}
