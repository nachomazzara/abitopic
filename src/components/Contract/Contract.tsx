import React, { Component } from 'react'
import { Contract as Web3Contract } from 'web3-eth-contract'
import { getWeb3Instance } from '../../lib/web3'
import { findABIForProxy, sanitizeABI } from '../../lib/utils'
import {
  saveLastUsedContract,
  getLastUsedContract,
  LastUsedContract
} from '../../lib/localStorage'
import Editor from '../../components/Editor' // @TODO: components as paths
import Loader from '../../components/Loader' // @TODO: components as paths
import Function from '../../components/Function' // @TODO: components as paths
import { Func } from '../../components/Function/types' // @TODO: components as paths
import Event from '../../components/Event' // @TODO: components as paths
import { Event as EventType } from '../../components/Event/types' // @TODO: components as paths
import { Props, State } from './types'

import 'react-dropdown/style.css'
import './Contract.css'

const TABS = {
  FUNCTIONS: 'Functions',
  EVENTS: 'Events'
}

export default class Contract extends Component<Props, State> {
  textarea: { [key: string]: any } = {}
  web3 = getWeb3Instance()

  constructor(props: Props) {
    super(props)

    const { address, abi, isProxy } = this.getInitParams()

    this.state = {
      contract: null,
      abi: abi,
      originalABI: null,
      events: null,
      functions: null,
      error: null,
      activeTab: TABS.EVENTS,
      isLoading: false,
      search: '',
      blockNumber: 'latest',
      contractName: '',
      address,
      isProxy
    }
  }

  getInitParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const paths = window.location.pathname.split('/').splice(1)
    const lastUsed = getLastUsedContract(this.props.index)
    const hasPath = paths.length > 0

    let address, abi, isProxy

    if (hasPath) {
      address = this.web3.utils.isAddress(paths[0]) ? paths[0] : null
      isProxy =
        paths.length > 1 && paths[1].indexOf('proxy') !== -1 ? true : isProxy
    }
    if (lastUsed) {
      address = address ? address : lastUsed.address
      isProxy = isProxy ? isProxy : lastUsed.isProxy
      abi = hasPath ? null : lastUsed.abi
    }

    return {
      address: searchParams.get('address') || address || '',
      isProxy: searchParams.get('isProxy')
        ? !!searchParams.get('isProxy')
        : !!isProxy,
      abi
    }
  }

  componentWillMount() {
    const { address, isProxy } = this.state
    this.getAddress(address, isProxy)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (
      nextProps.network !== this.props.network ||
      nextProps.apiNetwork !== this.props.apiNetwork
    ) {
      this.handleNetworkChange(nextProps.network, nextProps.apiNetwork)
    }
  }

  getByABI = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const abi = sanitizeABI(e.currentTarget.value)
    this.decode(abi)
    this.saveAction({ abi: abi })
  }

  getByAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    this.setState({
      address: e.currentTarget.value
    })
    this.getAddress(e.currentTarget.value, this.state.isProxy)
    this.saveAction({ address: e.currentTarget.value })
  }

  getABI = async (address: string, api?: string) => {
    if (address) {
      let abi
      try {
        const res = await fetch(
          `${api ? api : this.props.apiNetwork}${address}`
        )
        abi = await res.json()
      } catch (e) {
        return this.setState({
          error: 'Error fetching the abi',
          contractName: ''
        })
      }

      if (abi.result === 'Contract source code not verified') {
        this.setState({ error: abi.result, contractName: '' })
      } else {
        this.decode(abi.result)
      }
    }

    this.saveAction({})
  }

  setContractName = async () => {
    const { contract } = this.state
    try {
      const name = await contract!.methods.name().call()

      if (name) {
        document.title = name
        this.setState({ contractName: name })
      } else {
        this.setState({ contractName: '' })
      }
    } catch (e) {
      this.setState({ contractName: '' })
    }
  }

  getABIforProxy = async () => {
    const { address, isProxy } = this.state
    if (address.length > 0) {
      this.getAddress(address, !isProxy)
    }
    this.setState({ isProxy: !isProxy })
    this.saveAction({ isProxy: !isProxy })
  }

  getAddress = async (
    address: string,
    isProxy: boolean,
    network?: string,
    api?: string
  ) => {
    this.setState({
      isLoading: true
    })

    if (isProxy) {
      const implementationAddress = await findABIForProxy(
        network ? network : this.props.network,
        address
      )
      if (implementationAddress) {
        await this.getABI(implementationAddress, api)
      } else {
        this.setState({
          error: (
            <p>
              {'No implementation found. Please contact me'}
              <a href="https://twitter.com/nachomazzara" target="_blank">
                {'@nachomazzara'}
              </a>
            </p>
          )
        })
      }
    } else {
      await this.getABI(address, api)
    }

    this.setState({
      isLoading: false
    })
    this.saveAction({ address, isProxy })

    await this.setContractName()
  }

  decode = (abi: any) => {
    try {
      const validABI = JSON.parse(abi)
      const events: EventType[] = []
      const functions: Func[] = []

      for (const method of validABI) {
        if (!method.name) continue

        const types = method.inputs.map((input: any) => input.type)
        const name = `${method.name}(${types.join(',')})`

        const original = (
          <React.Fragment>
            {`${method.name}${method.inputs.length > 0 ? '(' : ''}`}
            {method.inputs.map((input: any, index: number) => (
              <React.Fragment key={index}>
                {index > 0 ? ' ' : ''}
                <span>
                  {input.type}{' '}
                  {input.indexed ? (
                    <label className="param-indexed">{'indexed '}</label>
                  ) : null}
                  <label className="param-name">{input.name}</label>
                  {index !== method.inputs.length - 1 ? ', ' : ''}
                </span>
                {index === method.inputs.length - 1 && <span>{')'}</span>}
              </React.Fragment>
            ))}
          </React.Fragment>
        )

        switch (method.type) {
          case 'event': {
            const signature = this.web3.eth.abi.encodeEventSignature(method)
            events.push({ name, signature, original })
            break
          }
          case 'function': {
            const selector = this.web3.eth.abi.encodeFunctionSignature(method)
            functions.push({
              name,
              selector,
              original,
              isConstant:
                method.constant ||
                method.stateMutability === 'pure' ||
                method.stateMutability === 'view',
              inputs: method.inputs,
              outputs: method.outputs,
              isPayable: method.payable || method.stateMutability === 'payable'
            })
            break
          }
          default:
            break
        }
      }

      const contract = new this.web3.eth.Contract(
        JSON.parse(abi),
        this.state.address
      ) as any // Types are getting crazy. Not gonna spend more time on this.

      this.setState({
        abi,
        contract,
        events: events.sort((a: EventType, b: EventType) =>
          a.name.localeCompare(b.name)
        ),
        functions: functions.sort((a: Func, b: Func) =>
          a.name.localeCompare(b.name)
        ),
        error: null
      })
    } catch (e) {
      this.setState({ error: e.message, abi })
    }
  }

  copyTopic = (event: string) => {
    this.textarea[event].select()
    document.execCommand('copy')
  }

  handleNetworkChange = (network: string, api: string) => {
    const { address, isProxy } = this.state

    this.setState({
      events: null,
      error: null
    })

    this.getAddress(address, isProxy, network, api)
  }

  onChangeTab = (activeTab: string) => {
    this.setState({ activeTab })
  }

  isActive = (tab: string) => tab === this.state.activeTab

  renderEvents = (events: EventType[]) => (
    <div className="results">
      {events.length > 0
        ? events.map((event, index) => <Event key={index} event={event} />)
        : this.renderEmptyResult()}
    </div>
  )

  renderFunctions = (functions: Func[]) => {
    const { contract, blockNumber } = this.state
    const { index } = this.props
    return (
      <div className="results">
        <Editor contract={contract} index={index} />
        {functions.length > 0
          ? functions.map(func => (
              <Function
                key={func.name}
                func={func}
                contract={contract!}
                blockNumber={blockNumber}
              />
            ))
          : this.renderEmptyResult()}
      </div>
    )
  }

  renderEmptyResult = () => <p className="no-results">No results...</p>

  filterBySearch = (data: any) =>
    data!.filter(
      (d: any) =>
        d.name.toLowerCase().indexOf(this.state.search.toLowerCase()) !== -1
    )

  handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ search: e.currentTarget.value })
  }

  handleBlockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      blockNumber:
        e.currentTarget.value.length > 0 ? e.currentTarget.value : 'latest'
    })
  }

  saveAction = (options: Partial<LastUsedContract>) => {
    const { address, abi, isProxy } = this.state
    const { index } = this.props

    saveLastUsedContract(
      Object.assign({ address, abi, isProxy }, options),
      index
    )
  }

  render() {
    const {
      events,
      functions,
      abi,
      address,
      error,
      isProxy,
      isLoading,
      search,
      blockNumber,
      contractName
    } = this.state
    const abiStr = abi
      ? JSON.stringify(abi)
          .replace(/\\"/g, '"')
          .slice(1, -1)
      : ''

    return (
      <>
        {isLoading && <Loader />}
        <div className="wrapper">
          <div className="address-wrapper">
            <h3>
              {'Contract Address'}{' '}
              <b>{contractName ? `(${contractName})` : ''}</b>
            </h3>
            <div className="input-wrapper">
              <input
                placeholder="0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"
                onChange={this.getByAddress}
                value={address}
              />
            </div>
            <div className="checkbox">
              <input
                id="checkbox"
                type="checkbox"
                onChange={this.getABIforProxy}
                defaultChecked={isProxy}
              />
              <label htmlFor="checkbox">{'Is proxy'}</label>
            </div>
          </div>
          <div>
            <h3>{'ABI / JSON Interface'}</h3>
            <textarea
              className="abi"
              placeholder={
                '[{"type":"constructor","inputs":[{"name":"param1","type":"uint256","indexed":true}],"name":"Event"},{"type":"function","inputs":[{"name":"a","type":"uint256"}],"name":"foo","outputs":[]}]'
              }
              spellCheck={false}
              onChange={this.getByABI}
              value={abiStr}
            />
          </div>
        </div>
        <p className="error">{error}</p>
        {events && functions && (
          <React.Fragment>
            <div className="tabs">
              <div>
                <a
                  className={this.isActive(TABS.EVENTS) ? 'active' : ''}
                  onClick={() => this.onChangeTab(TABS.EVENTS)}
                >
                  {TABS.EVENTS}
                </a>
              </div>
              <div>
                <a
                  className={this.isActive(TABS.FUNCTIONS) ? 'active' : ''}
                  onClick={() => this.onChangeTab(TABS.FUNCTIONS)}
                >
                  {TABS.FUNCTIONS}
                </a>
                {this.isActive(TABS.FUNCTIONS) && (
                  <input
                    type="number"
                    placeholder="BlockNo: latest"
                    onChange={this.handleBlockNumberChange}
                    value={blockNumber === 'latest' ? '' : blockNumber}
                  />
                )}
              </div>
            </div>
            <div className="search">
              <input
                type="text"
                value={search}
                onChange={this.handleSearchChange}
                placeholder="Search..."
              />
            </div>
            {this.isActive(TABS.EVENTS) &&
              this.renderEvents(this.filterBySearch(events))}
            {this.isActive(TABS.FUNCTIONS) &&
              this.renderFunctions(this.filterBySearch(functions))}
          </React.Fragment>
        )}
      </>
    )
  }
}
