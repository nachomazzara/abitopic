import { getWeb3Instance } from './web3'
import { Contract } from 'web3-eth-contract/types'

export const TOPICS_FOR_PROXYS = [
  {
    topic: '0xe74baeef5988edac1159d9177ca52f0f3d68f624a1996f77467eb3ebfb316537',
    indexed: 1
  },
  {
    topic: '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
    dataIndex: 1
  },
  {
    topic: '0x4d72fe0577a3a3f7da968d7b892779dde102519c25527b29cf7054f245c791b9', // Aragon's Initialization
    indexed: 2
  }
]


export const CHAINS = {
  ETHEREUM_MAINNET: { value: 'mainnet', label: 'Ethereum Mainnet', id: 1 },
  ETHEREUM_ROPSTEN: { value: 'ropsten', label: 'Ropsten Testnet', id: 3 },
  ETHEREUM_RINKEBY: { value: 'rinkeby', label: 'Rinkeby Testnet', id: 4 },
  ETHEREUM_GOERLI: { value: 'goerli', label: 'Goerli Testnet', id: 5 },
  ETHEREUM_KOVAN: { value: 'kovan', label: 'Kovan Testnet', id: 42 },
  BSC_MAINNET: { value: 'bsc', label: 'Binance Smart Chain Mainnet', id: 56 },
  BSC_TESTNET: {
    value: 'bsc-testnet',
    label: 'Binance Smart Chain Testnet',
    id: 97
  },
  MATIC_MAINNET: { value: 'matic', label: 'Matic Mainnet', id: 137 },
  MATIC_MUMBAI: { value: 'mumbai', label: 'Matic Mumbai', id: 80001 }
}


export const CUSTOM_NETWORK = 'custom'


function isEthereumChain(network: string) {
  return (
    network === CHAINS.ETHEREUM_MAINNET.value ||
    network === CHAINS.ETHEREUM_ROPSTEN.value ||
    network === CHAINS.ETHEREUM_KOVAN.value ||
    network === CHAINS.ETHEREUM_GOERLI.value ||
    network === CHAINS.ETHEREUM_RINKEBY.value
  )
}

function isMaticChain(network: string) {
  return (
    network === CHAINS.MATIC_MAINNET.value || network === CHAINS.MATIC_MUMBAI.value
  )
}

function isBSCChain(network: string) {
  return network === CHAINS.BSC_MAINNET.value || network === CHAINS.BSC_TESTNET.value
}

export function getAPIKey(network: string) {
  if (isEthereumChain(network)) {
    return 'BPS6G2415Z1J5KV85FP76QFD3MXM1U39BU'
  }
  if (isBSCChain(network)) {
    return 'XUB8PMY81UWB8TFVIN8A36SZUG1Q7H4ZD5'
  }
  if (isMaticChain(network)) {
    return ''
  }

  console.warn(`Could not find any API Key for the chain: ${network}`)

  return ''
}

export function getAPI(network: string): string {
  if (isEthereumChain(network)) {
    return `https://api${network !== 'mainnet' ? `-${network}` : ''
      }.etherscan.io/api`
  }

  if (isBSCChain(network)) {
    return `https://api${network === CHAINS.BSC_TESTNET.value ? '-testnet' : ''
      }.bscscan.com/api`
  }

  if (isMaticChain(network)) {
    return `https://api${network === CHAINS.MATIC_MUMBAI.value ? '-testnet' : ''
      }.polygonscan.com/api`
  }

  console.warn(`Could not find any API for the chain: ${network}`)

  return ''
}

export function getTxLink(network: string): string {
  if (isEthereumChain(network)) {
    return `https://${network !== 'mainnet' ? `${network}` : ''
      }.etherscan.io/tx`
  }

  if (isBSCChain(network)) {
    return `https://${network === CHAINS.BSC_TESTNET.value ? 'testnet' : ''
      }.bscscan.com/tx`
  }

  if (isMaticChain(network)) {
    return `https://${network === CHAINS.MATIC_MUMBAI.value ? 'mumbai' : ''
      }.polygonscan.com/tx`
  }

  console.warn(`Could not find any API for the chain: ${network}`)

  return ''
}

export async function findABIForProxy(
  network: string,
  proxyAddress: string
): Promise<string | undefined> {
  const web3 = getWeb3Instance()
  const baseAPI = getAPI(network)
  const apiKey = getAPIKey(network)
  const api = `${baseAPI}?module=logs&&apikey=${apiKey}&action=getLogs&fromBlock=0&toBlock=latest&limit=1&address=${proxyAddress}&topic0=`

  let address
  for (let { topic, indexed, dataIndex } of TOPICS_FOR_PROXYS) {
    const res = await fetch(`${api}${topic}`)
    const data = await res.json()
    if (data.result.length > 0) {
      const event = data.result.pop()
      address = indexed
        ? getAddressByTopic(event, indexed!)
        : getAddressByData(event, dataIndex!)
      if (address) {
        return address
      }
    }
  }

  address = getAddressByStorageSlot(web3, network, proxyAddress)

  return address
}

function getAddressByTopic(event: { topics: string[] }, index: number) {
  return `0x${event.topics[index].slice(-40)}`
}

function getAddressByData(event: { data: string }, index: number) {
  const from = 32 * (index - 1) + 24
  return `0x${event.data.slice(2).substr(from, from + 40)}`
}

async function getAddressByStorageSlot(
  web3: any,
  network: string,
  proxyAddress: string
): Promise<string | undefined> {
  const baseAPI = getAPI(network)
  const apiKey = getAPIKey(network)

  const res = await fetch(
    `${baseAPI}?module=proxy&action=eth_getStorageAt&apikey=${apiKey}&address=${proxyAddress}&position=0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3&tag=latest`
  )
  const data = (await res.json()).result

  let address
  if (data && web3.utils.isAddress(data.slice(-40))) {
    address = `0x${data.slice(-40)}`
  }

  return address
}

export function sanitizeABI(abi: string) {
  return abi
    .trim()
    .replace(/(\r\n|\n|\r)/gm, '')
    .replace(/\s+/g, '')
    .replace(
      /(\w+:)|(\w+ :)/g,
      matchedStr => `"${matchedStr.substring(0, matchedStr.length - 1)}":`
    )
}

export function getChains() {
  return Object.values(CHAINS)
}

export function getNetworkNameById(id: number): string {
  const chain = getChains().find(chain => chain.id === id)
  return chain ? chain.value : ''
}

export function isOS() {
  return navigator.userAgent.match(/ipad|iphone/i)
}

// Replace `methods: any` to `{ methodName: (params: types) Promise<any>}`
export function typeContractMethods(editorTypes: string, contract: Contract) {
  const methodTypes = `methods: {
    ${contract!.options.jsonInterface.map((method: any) => {
    let inputs = ''

    method.inputs.forEach((input: any, index: number) => {
      if (index > 0) {
        inputs += ', '
      }

      inputs += input.name
        ? input.name
        : method.inputs.length > 1
          ? `${input.type}_${index}`
          : input.type

      if (input.type.indexOf('int') !== -1) {
        inputs += ': number'
      } else {
        inputs += ': string'
      }

      if (input.type.indexOf('[]') !== -1) {
        inputs += `[]`
      }
    })

    return `${method.name}: (${inputs}) => any`
  })
      .join('\n')}
  }`

  return editorTypes.replace('contractMethods: any', methodTypes)
}