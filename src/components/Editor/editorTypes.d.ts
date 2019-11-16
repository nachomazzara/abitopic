// This file is based of web3.js v1.2.2

declare type AbiType = 'function' | 'constructor' | 'event' | 'fallback'
declare type StateMutabilityType = 'pure' | 'view' | 'nonpayable' | 'payable'

declare interface AbiInput {
  name: string
  type: string
  indexed?: boolean
  components?: AbiInput[]
}

declare interface AbiOutput {
  name: string
  type: string
  components?: AbiOutput[]
}

declare interface AbiItem {
  anonymous?: boolean
  constant?: boolean
  inputs?: AbiInput[]
  name?: string
  outputs?: AbiOutput[]
  payable?: boolean
  stateMutability?: StateMutabilityType
  type: AbiType
}

declare interface ContractOptions {
  // Sender to use for contract calls
  from?: string
  // Gas price to use for contract calls
  gasPrice?: string
  // Gas to use for contract calls
  gas?: number
  // Contract code
  data?: string
}

declare interface Contract {
  defaultAccount: string | null
  defaultBlock: string | number
  defaultCommon: Common
  defaultHardfork: hardfork
  defaultChain: chain
  transactionPollingTimeout: number
  transactionConfirmationBlocks: number
  transactionBlockTimeout: number
  options: Options
  clone(): Contract
  deploy(options: DeployOptions): ContractSendMethod
  methods: any
  once(event: string, callback: (error: Error, event: EventData) => void): void
  once(
    event: string,
    options: EventOptions,
    callback: (error: Error, event: EventData) => void
  ): void
  events: any
  getPastEvents(event: string): Promise<EventData[]>
  getPastEvents(
    event: string,
    options: EventOptions,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>
  getPastEvents(event: string, options: EventOptions): Promise<EventData[]>
  getPastEvents(
    event: string,
    callback: (error: Error, event: EventData) => void
  ): Promise<EventData[]>
}

declare var contract: Contract
