import Web3 from 'web3'
import { EthereumProvider } from 'web3-providers/types'

export interface EthereumWindow {
  ethereum?: EthereumProvider & {
    _metamask: { isApproved: () => Promise<boolean> }
    isApproved: () => Promise<boolean>

    enable?: () => Promise<string[]>

    autoRefreshOnNetworkChange: boolean
    networkVersion: number
  }
}

const { ethereum } = (window as unknown) as EthereumWindow

if (ethereum) {
  ethereum.autoRefreshOnNetworkChange = false
}

let web3: Web3
let chainId: number

export function getWeb3Instance(): Web3 {
  const { ethereum } = window as EthereumWindow

  const networkChanged = ethereum && ethereum.networkVersion !== chainId

  if (!web3 || networkChanged) {
    console.log('aaaaaa')
    chainId = ethereum ? ethereum.networkVersion : 0
    web3 = new Web3(ethereum ? ethereum : new Web3.providers.HttpProvider('https://localhost:8545'))
  }
  console.log('bbbbbb')
  return web3
}