import { Event as EventType } from '../../components/Event/types' // @TODO: components as paths
import { Func } from '../../components/Function/types' // @TODO: components as paths
import { ReactElement } from 'react'

export type State = {
  contract: any
  address: string
  abi: any
  originalABI: any
  events: EventType[] | null
  functions: Func[] | null
  error: string | ReactElement<HTMLElement> | null
  activeTab: string
  apiNetwork: string
  network: string
  isProxy: boolean
  isLoading: boolean
  search: string
  blockNumber: string
}
