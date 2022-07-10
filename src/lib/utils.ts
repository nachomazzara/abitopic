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
export const MULTISIG_ELEMENT_NAME = 'Multisig address'

// Old Zeppelin proxy
const PROXY_POSITION =
  '0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3'
// https://eips.ethereum.org/EIPS/eip-1967 Zeppelin
const TRANSPARENT_PROXY_POSITION =
  '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'

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
    network === CHAINS.MATIC_MAINNET.value ||
    network === CHAINS.MATIC_MUMBAI.value
  )
}

function isBSCChain(network: string) {
  return (
    network === CHAINS.BSC_MAINNET.value || network === CHAINS.BSC_TESTNET.value
  )
}

export function getAPIKey(network: string) {
  if (isEthereumChain(network)) {
    return 'BPS6G2415Z1J5KV85FP76QFD3MXM1U39BU'
  }
  if (isBSCChain(network)) {
    return 'XUB8PMY81UWB8TFVIN8A36SZUG1Q7H4ZD5'
  }
  if (isMaticChain(network)) {
    return 'VNZGFJTJI9T2PDCKAM188BGJC1UJ4ETJCE'
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
    return `https://${network !== 'mainnet' ? `${network}.` : ''
      }etherscan.io/tx`
  }

  if (isBSCChain(network)) {
    return `https://${network === CHAINS.BSC_TESTNET.value ? 'testnet.' : ''
      }bscscan.com/tx`
  }

  if (isMaticChain(network)) {
    return `https://${network === CHAINS.MATIC_MUMBAI.value ? 'mumbai.' : ''
      }polygonscan.com/tx`
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
    if (data.result.length > 0 && Number(data.status) !== 0) {
      const event = data.result.pop()
      address = indexed
        ? getAddressByTopic(event, indexed!)
        : getAddressByData(event, dataIndex!)
      if (address && address != '0x') {
        return address
      }
    }
  }

  address = await getAddressByStorageSlot(
    web3,
    network,
    proxyAddress,
    PROXY_POSITION
  )
  if (!address) {
    address = await getAddressByStorageSlot(
      web3,
      network,
      proxyAddress,
      TRANSPARENT_PROXY_POSITION
    )
  }

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
  proxyAddress: string,
  storagePosition: string
): Promise<string | undefined> {
  const baseAPI = getAPI(network)
  const apiKey = getAPIKey(network)

  const res = await fetch(
    `${baseAPI}?module=proxy&action=eth_getStorageAt&apikey=${apiKey}&address=${proxyAddress}&position=${storagePosition}&tag=latest`
  )
  const data = (await res.json()).result

  let address
  if (
    data &&
    data !=
    '0x0000000000000000000000000000000000000000000000000000000000000000' &&
    web3.utils.isAddress(data.slice(-40))
  ) {
    address = `0x${data.slice(-40)}`
  }

  return address
}

export async function getFlattenSourceCode(network: string, address: string) {
  const baseAPI = getAPI(network)
  const apiKey = getAPIKey(network)

  const res = await fetch(
    `${baseAPI}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
  )
  return JSON.parse((await res.json()).result[0].SourceCode.slice(1, -1))
    .sources
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

export function isIOS() {
  return navigator.userAgent.match(/ipad|iphone/i)
}

// Replace `methods: any` to `{ methodName: (params: types) Promise<any>}`
export function typeContractMethods(editorTypes: string, contract: Contract) {
  const methodTypes = `methods: {
    ${contract!.options.jsonInterface
      .map((method: any) => {
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

export function isConfirmMultisigTx(funcName: string) {
  return funcName === 'confirmTransaction(uint256)'
}

export function isRevokeMultisigTx(funcName: string) {
  return funcName === 'revokeConfirmation(uint256)'
}

export function isMultisigTx(funcName: string) {
  return isConfirmMultisigTx(funcName) || isRevokeMultisigTx(funcName)
}

export function getMultisigContract(address: string) {
  const web3 = getWeb3Instance()

  return new web3.eth.Contract(getLegacyMultisigABI(), address) as any // Types are getting crazy. Not gonna spend more time on this.
}

function getLegacyMultisigABI(): AbiItem[] {
  return [
    {
      constant: true,
      inputs: [{ name: '', type: 'uint256' }],
      name: 'owners',
      outputs: [{ name: '', type: 'address' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: 'owner', type: 'address' }],
      name: 'removeOwner',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'revokeConfirmation',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: '', type: 'address' }],
      name: 'isOwner',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: '', type: 'uint256' }, { name: '', type: 'address' }],
      name: 'confirmations',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'calcMaxWithdraw',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [
        { name: 'pending', type: 'bool' },
        { name: 'executed', type: 'bool' }
      ],
      name: 'getTransactionCount',
      outputs: [{ name: 'count', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'dailyLimit',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'lastDay',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: 'owner', type: 'address' }],
      name: 'addOwner',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'isConfirmed',
      outputs: [{ name: '', type: 'bool' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'getConfirmationCount',
      outputs: [{ name: 'count', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: '', type: 'uint256' }],
      name: 'transactions',
      outputs: [
        { name: 'destination', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'executed', type: 'bool' }
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'getOwners',
      outputs: [{ name: '', type: 'address[]' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [
        { name: 'from', type: 'uint256' },
        { name: 'to', type: 'uint256' },
        { name: 'pending', type: 'bool' },
        { name: 'executed', type: 'bool' }
      ],
      name: 'getTransactionIds',
      outputs: [{ name: '_transactionIds', type: 'uint256[]' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'getConfirmations',
      outputs: [{ name: '_confirmations', type: 'address[]' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'transactionCount',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: '_required', type: 'uint256' }],
      name: 'changeRequirement',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'confirmTransaction',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        { name: 'destination', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' }
      ],
      name: 'submitTransaction',
      outputs: [{ name: 'transactionId', type: 'uint256' }],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: '_dailyLimit', type: 'uint256' }],
      name: 'changeDailyLimit',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'MAX_OWNER_COUNT',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'required',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      constant: false,
      inputs: [
        { name: 'owner', type: 'address' },
        { name: 'newOwner', type: 'address' }
      ],
      name: 'replaceOwner',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: false,
      inputs: [{ name: 'transactionId', type: 'uint256' }],
      name: 'executeTransaction',
      outputs: [],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      constant: true,
      inputs: [],
      name: 'spentToday',
      outputs: [{ name: '', type: 'uint256' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { name: '_owners', type: 'address[]' },
        { name: '_required', type: 'uint256' },
        { name: '_dailyLimit', type: 'uint256' }
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    { payable: true, stateMutability: 'payable', type: 'fallback' },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: 'dailyLimit', type: 'uint256' }],
      name: 'DailyLimitChange',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'sender', type: 'address' },
        { indexed: true, name: 'transactionId', type: 'uint256' }
      ],
      name: 'Confirmation',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'sender', type: 'address' },
        { indexed: true, name: 'transactionId', type: 'uint256' }
      ],
      name: 'Revocation',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'transactionId', type: 'uint256' }],
      name: 'Submission',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'transactionId', type: 'uint256' }],
      name: 'Execution',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'transactionId', type: 'uint256' }],
      name: 'ExecutionFailure',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'sender', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' }
      ],
      name: 'Deposit',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'owner', type: 'address' }],
      name: 'OwnerAddition',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: true, name: 'owner', type: 'address' }],
      name: 'OwnerRemoval',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, name: 'required', type: 'uint256' }],
      name: 'RequirementChange',
      type: 'event'
    }
  ]
}
