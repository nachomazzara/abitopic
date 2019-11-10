import Web3 from 'web3'
import { EthereumProvider } from 'web3-providers/types'

export interface EthereumWindow {
  ethereum?: EthereumProvider & {
    enable?: () => Promise<string[]>

    autoRefreshOnNetworkChange: boolean
    networkVersion: number
  }
}

const { ethereum } = window as EthereumWindow

if (ethereum) {
  ethereum.autoRefreshOnNetworkChange = false
}

let web3: Web3
let chainId: number

export function getWeb3Instance(): Web3 {
  const { ethereum } = window as EthereumWindow

  const networkChanged = ethereum && ethereum.networkVersion !== chainId

  if (!web3 || networkChanged) {
    chainId = ethereum ? ethereum.networkVersion : 0
    web3 = new Web3(
      ethereum
        ? ethereum
        : new Web3.providers.HttpProvider('https://localhost:8545')
    )
  }
  return web3
}

export async function getDefaultAccount(): Promise<string | undefined> {
  const { ethereum } = window as EthereumWindow

  try {
    if (ethereum && ethereum.enable) {
      await ethereum.enable()
      const accounts = await getWeb3Instance().eth.getAccounts()
      return accounts[0]
    }
  } catch (e) {
    console.log(e.message)
  }
  return undefined
}
