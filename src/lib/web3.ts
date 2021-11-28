const Web3 = require('web3')

export interface EthereumWindow {
  ethereum?: {
    enable?: () => Promise<string[]>

    autoRefreshOnNetworkChange: boolean
    networkVersion: number
  }
}

const { ethereum } = window as EthereumWindow

if (ethereum) {
  ethereum.autoRefreshOnNetworkChange = false
}

let web3Instance: Web3
let chainId: number

export function getWeb3Instance(): Web3 {
  const { ethereum } = window as EthereumWindow

  const networkChanged = ethereum && ethereum.networkVersion !== chainId

  if (!web3Instance || networkChanged) {
    chainId = ethereum ? ethereum.networkVersion : 0
    web3Instance = new Web3(ethereum ? ethereum : 'https://localhost:8545')
  }
  return web3Instance
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
    throw new Error('Please connect your wallet')
  }
}
