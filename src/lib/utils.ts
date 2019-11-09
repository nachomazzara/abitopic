import { getWeb3Instance } from './web3'


export const TOPICS_FOR_PROXYS = [
  {
    topic: '0xe74baeef5988edac1159d9177ca52f0f3d68f624a1996f77467eb3ebfb316537',
    indexed: 1
  },
  {
    topic: '0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b',
    dataIndex: 1
  }
]

export async function findABIForProxy(
  network: string,
  proxyAddress: string
): Promise<string | undefined> {
  const web3 = getWeb3Instance()
  const api = `https://api${
    network !== 'ropsten' ? `-${network}` : ''
    }.etherscan.io/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&limit=1&address=${proxyAddress}&topic0=`

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
  const res = await fetch(
    `https://api${
    network !== 'ropsten' ? `-${network}` : ''
    }.etherscan.io/api?module=proxy&action=eth_getStorageAt&address=${proxyAddress}&position=0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3&tag=latest`
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
  return [
    { value: 'mainnet', label: 'Ethereum Mainnet', id: 1 },
    { value: 'ropsten', label: 'Ropsten Testnet', id: 3 },
    { value: 'kovan', label: 'Kovan Testnet', id: 42 },
    { value: 'rinkeby', label: 'Rinkeby Testnet', id: 4 },
    { value: 'goerli', label: 'Goerli Testnet', id: 5 }
  ]
}

export function getNetworkNameById(id: number): string {
  const chain = getChains().find(chain => chain.id === id)
  return chain ? chain.value : ''
}
