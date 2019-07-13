import React, { Component } from 'react'

import logo from './logo.svg'
import { findABIForProxy } from '../../lib/utils'
import Loader from '../../components/Loader' // @TODO: components as paths
import Function from '../../components/Function' // @TODO: components as paths
import { Func } from '../../components/Function/types' // @TODO: components as paths
import Event from '../../components/Event' // @TODO: components as paths
import { Event as EventType } from '../../components/Event/types' // @TODO: components as paths
import { State } from './types'

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
    const network =
      new URLSearchParams(window.location.search).get('network') || 'mainnet'
    this.state = {
      contract: null,
      address: '',
      abi: null,
      originalABI: null,
      events: null,
      functions: null,
      error: null,
      activeTab: TABS.EVENTS,
      isProxy: false,
      isLoading: false,
      apiNetwork: `https://api${
        network === 'ropsten' ? `-${network}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network
    }
  }

  getByABI = (e: any) => {
    e.preventDefault()
    this.decode('', e.target.value)
  }

  getByAddress = (e: any) => {
    e.preventDefault()
    this.setState({
      address: e.target.value
    })
    this.getAddress(e.target.value, this.state.isProxy)
  }

  getABI = async (address: string) => {
    if (address) {
      const res = await fetch(`${this.state.apiNetwork}${address}`)
      const abi = await res.json()
      if (abi.result === 'Contract source code not verified') {
        this.setState({ error: abi.result })
      } else {
        this.decode(address, abi.result)
      }
    }
  }

  getABIforProxy = async () => {
    const { address, isProxy } = this.state
    if (address.length > 0) {
      this.getAddress(address, !isProxy)
    }
    this.setState({ isProxy: !isProxy })
  }

  getAddress = async (address: string, isProxy: boolean) => {
    this.setState({
      isLoading: true
    })

    const { network } = this.state
    if (isProxy) {
      const implementationAddress = await findABIForProxy(
        web3,
        network,
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
  }

  decode = (address: string, abi: any) => {
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

  changeNetwork = () => {
    const { network } = this.state as any

    const newNetwork = network === 'ropsten' ? 'mainnet' : 'ropsten'
    history.pushState(
      network,
      newNetwork,
      `${window.location.origin}?network=${newNetwork}`
    )

    this.setState({
      apiNetwork: `https://api${
        newNetwork === 'ropsten' ? `-${newNetwork}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network: newNetwork,
      address: '',
      abi: null,
      events: null,
      error: null
    })
  }

  onChangeTab = (activeTab: string) => {
    this.setState({ activeTab })
  }

  isActive = (tab: string) => tab === (this.state as any).activeTab

  renderEvents = (events: EventType[]) => (
    <div className="results">
      {events.map((event, index) => <Event key={index} event={event} />)}
    </div>
  )

  renderFunctions = (functions: Func[]) => (
    <div className="results">
      {functions.map((func, index) => (
        <Function key={index} func={func} contract={this.state.contract} />
      ))}
    </div>
  )

  render() {
    const {
      events,
      functions,
      abi,
      address,
      error,
      network,
      isProxy,
      isLoading
    } = this.state
    const abiStr = abi
      ? JSON.stringify(abi)
          .replace(/\\"/g, '"')
          .slice(1, -1)
      : ''
    return (
      <>
        {isLoading && <Loader />}
        <div className="App">
          <div className="header">
            <p>{`${network}`}</p>
            <a onClick={this.changeNetwork}>
              {`Switch to ${network === 'ropsten' ? 'mainnet' : 'ropsten'}`}
            </a>
          </div>
          <h1>{'ABItopic'}</h1>
          <h2>
            {
              'Get the events topics0 and function selectors from a contract by the'
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
          {events &&
            functions && (
              <React.Fragment>
                <div className="tabs">
                  <a
                    className={this.isActive(TABS.EVENTS) ? 'active' : ''}
                    onClick={() => this.onChangeTab(TABS.EVENTS)}
                  >
                    {TABS.EVENTS}
                  </a>
                  <a
                    className={this.isActive(TABS.FUNCTIONS) ? 'active' : ''}
                    onClick={() => this.onChangeTab(TABS.FUNCTIONS)}
                  >
                    {TABS.FUNCTIONS}
                  </a>
                </div>
                {this.isActive(TABS.EVENTS) && this.renderEvents(events)}
                {this.isActive(TABS.FUNCTIONS) &&
                  this.renderFunctions(functions)}
              </React.Fragment>
            )}
          <div className="footer">
            <a target="_blank" href="https://github.com/nachomazzara/abitopic">
              {'{code} 👨‍💻'}
            </a>
          </div>
        </div>
      </>
    )
  }
}
