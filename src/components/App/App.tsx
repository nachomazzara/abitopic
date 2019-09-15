import React, { Component } from 'react'
import Dropdown, { Option } from 'react-dropdown'

import logo from './logo.svg'
import { findABIForProxy, sanitizeABI, getChains } from '../../lib/utils'
import { saveLastUsed, getLastUsed, LastUsed } from '../../lib/localStorage'
import Loader from '../../components/Loader' // @TODO: components as paths
import Function from '../../components/Function' // @TODO: components as paths
import { Func } from '../../components/Function/types' // @TODO: components as paths
import Event from '../../components/Event' // @TODO: components as paths
import { Event as EventType } from '../../components/Event/types' // @TODO: components as paths
import { EthereumWindow } from '../../components/Transaction/types'
import { State } from './types'

import 'react-dropdown/style.css'
import './App.css'

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const TABS = {
  FUNCTIONS: 'Functions',
  EVENTS: 'Events'
}

export default class App extends Component<any, State> {
  textarea: { [key: string]: any } = {}

  constructor(props: any) {
    super(props)

    const { network, address, abi, isProxy } = this.getInitParams()

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
      apiNetwork: `https://api${
        network !== 'mainnet' ? `-${network}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      address,
      isProxy,
      network
    }
  }

  getInitParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const paths = window.location.pathname.split('/').splice(1)
    const lastUsed = getLastUsed()
    const hasPath = paths.length > 0

    let network, address, abi, isProxy

    if (hasPath) {
      address = web3.utils.isAddress(paths[0]) ? paths[0] : null
      isProxy =
        paths.length > 1 && paths[1].indexOf('proxy') !== -1 ? true : isProxy
    }
    if (lastUsed) {
      network = lastUsed.network
      address = address ? address : lastUsed.address
      isProxy = isProxy ? isProxy : lastUsed.isProxy
      abi = hasPath ? null : lastUsed.abi
    }

    return {
      network: searchParams.get('network') || network || 'mainnet',
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

    const { ethereum } = (window as unknown) as EthereumWindow

    if (ethereum) {
      ethereum.autoRefreshOnNetworkChange = false
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

  getABI = async (address: string) => {
    if (address) {
      const res = await fetch(`${this.state.apiNetwork}${address}`)
      const abi = await res.json()
      if (abi.result === 'Contract source code not verified') {
        this.setState({ error: abi.result })
      } else {
        this.decode(abi.result)
      }
    }

    this.saveAction({})
  }

  getABIforProxy = async () => {
    const { address, isProxy } = this.state
    if (address.length > 0) {
      this.getAddress(address, !isProxy)
    }
    this.setState({ isProxy: !isProxy })
    this.saveAction({ isProxy: !isProxy })
  }

  getAddress = async (address: string, isProxy: boolean, network?: string) => {
    this.setState({
      isLoading: true
    })

    if (isProxy) {
      const implementationAddress = await findABIForProxy(
        web3,
        network ? network : this.state.network,
        address
      )
      if (implementationAddress) {
        await this.getABI(implementationAddress)
      } else {
        this.setState({
          error: 'No implementation found. Please contact me @nachomazzara'
        })
      }
    } else {
      await this.getABI(address)
    }
    this.setState({
      isLoading: false
    })
    this.saveAction({ address, isProxy, network })
  }

  decode = (abi: any) => {
    try {
      const validABI = JSON.parse(abi)
      const events: EventType[] = []
      const functions: Func[] = []
      const constants = []
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
            const signature = web3.utils.sha3(name)
            events.push({ name, signature, original })
            break
          }
          case 'function': {
            const selector = web3.eth.abi.encodeFunctionSignature(name)
            functions.push({
              name,
              selector,
              original,
              isConstant: method.constant,
              inputs: method.inputs,
              outputs: method.outputs
            })
            break
          }
          default:
            break
        }
      }

      const contract = new web3.eth.Contract(
        JSON.parse(abi),
        this.state.address
      )

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

  changeNetwork = (option: Option) => {
    const { network, address, isProxy } = this.state

    const newNetwork = option.value

    history.pushState(
      network,
      newNetwork,
      `${window.location.origin}?network=${newNetwork}`
    )

    this.setState({
      apiNetwork: `https://api${
        newNetwork !== 'mainnet' ? `-${newNetwork}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network: newNetwork,
      events: null,
      error: null
    })

    this.getAddress(address, isProxy, newNetwork)
    this.saveAction({ network: newNetwork })
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
    return (
      <div className="results">
        {functions.length > 0
          ? functions.map((func, index) => (
              <Function
                key={index}
                func={func}
                contract={contract}
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

  saveAction = (options: Partial<LastUsed>) => {
    const { network, address, abi, isProxy } = this.state
    saveLastUsed(Object.assign({ network, address, abi, isProxy }, options))
  }

  render() {
    const {
      events,
      functions,
      abi,
      address,
      error,
      network,
      isProxy,
      isLoading,
      search,
      blockNumber
    } = this.state
    const abiStr = abi
      ? JSON.stringify(abi)
          .replace(/\\"/g, '"')
          .slice(1, -1)
      : ''

    const chains = getChains()
    return (
      <>
        {isLoading && <Loader />}
        <div className="App">
          <div className="header">
            <Dropdown
              options={chains}
              onChange={this.changeNetwork}
              value={network}
            />
          </div>
          <h1>{'ABItopic'}</h1>
          <h2>
            {
              'Get events topic0, function selectors and interact with contracts by the'
            }
            <strong>{' address'}</strong> or <strong>{'ABI'}</strong>
          </h2>
          <div className="wrapper">
            <div className="address-wrapper">
              <h3>{'Contract Address'}</h3>
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
          <div className="footer">
            <a target="_blank" href="https://github.com/nachomazzara/abitopic">
              {'{code} 👨‍💻'}
            </a>
            <a
              target="_blank"
              href="https://etherscan.com/address/0x2FFDbd3e8B682eDC3e7a9ced16Eba60423D3BFb6"
            >
              {'Donate ❤️'}
            </a>
          </div>
        </div>
      </>
    )
  }
}
