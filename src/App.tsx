import React, { Component } from 'react'
import logo from './logo.svg'

import './App.css'
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const TABS = {
  FUNCTIONS: 'Functions',
  EVENTS: 'Events'
}

class App extends Component {
  textarea: { [key: string]: any } = {}

  constructor(props: any) {
    super(props)
    const network =
      new URLSearchParams(window.location.search).get('network') || 'mainnet'
    this.state = {
      address: '',
      abi: null,
      events: null,
      functions: null,
      error: null,
      activeTab: TABS.EVENTS,
      apiNetwork: `https://api${
        network === 'ropsten' ? `-${network}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network
    }
  }

  getByABI = (e: any) => {
    e.preventDefault()
    this.decode(e.target.value)
  }

  getByAddress = async (e: any) => {
    e.preventDefault()
    const address = e.target.value
    this.setState({ address })
    const res = await fetch(`${(this.state as any).apiNetwork}${address}`)
    const abi = await res.json()
    if (abi.result === 'Contract source code not verified') {
      this.setState({ error: abi.result })
    } else {
      this.decode(abi.result)
    }
  }

  decode = (abi: any) => {
    try {
      const validABI = JSON.parse(abi)
      const events = []
      const functions = []
      const constants = []
      for (const method of validABI) {
        if (!method.name) continue

        const name = `${method.name}(${method.inputs
          .map((input: any) => input.type)
          .join(',')})`

        const original = (
          <React.Fragment>
            {`${method.name}${method.inputs.length > 0 ? '(' : ''}`}
            {method.inputs.map((input: any, index: number) => (
              <React.Fragment key={index}>
                {' '}
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
            if (method.constant) {
              constants.push({ name, selector, original })
            } else {
              functions.push({ name, selector, original })
            }
            break
          }
          default:
            break
        }
      }
      this.setState({
        error: null,
        abi,
        events,
        functions: [...functions, ...constants]
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

  renderEvents = (events: { name: string; signature: string }[]) =>
    this.isActive(TABS.EVENTS) && (
      <div className="results">
        {events.map((event: any) => (
          <React.Fragment key={event.signature}>
            <div className="result">
              <p>{event.name}</p>
              <p className="original">{event.original}</p>
              <p>
                {'[Topic0]'}
                <textarea
                  readOnly
                  ref={textarea => (this.textarea[event.signature] = textarea)}
                  value={event.signature}
                />
                <button onClick={() => this.copyTopic(event.signature)}>
                  {'[copy]'}
                </button>
              </p>
            </div>
          </React.Fragment>
        ))}
      </div>
    )

  renderFunctions = (functions: { name: string; selector: string }[]) =>
    this.isActive(TABS.FUNCTIONS) && (
      <div className="results">
        {functions.map((func: any) => (
          <React.Fragment key={func.selector}>
            <div className="result">
              <p>{func.name}</p>
              <p className="original">{func.original}</p>
              <p>
                {'[Selector]'}
                <textarea
                  readOnly
                  ref={textarea => (this.textarea[func.selector] = textarea)}
                  value={func.selector}
                />
                <button onClick={() => this.copyTopic(func.selector)}>
                  {'[copy]'}
                </button>
              </p>
            </div>
          </React.Fragment>
        ))}
      </div>
    )

  render() {
    const { events, functions, abi, address, error, network } = this
      .state as any
    const abiStr = abi
      ? JSON.stringify(abi)
          .replace(/\\"/g, '"')
          .slice(1, -1)
      : ''
    return (
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
          <div>
            <h3>{'Contract Address'}</h3>
            <input
              placeholder="0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2"
              onChange={this.getByAddress}
              value={address}
            />
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
              {this.renderEvents(events)}
              {this.renderFunctions(functions)}
            </React.Fragment>
          )}
        <div className="footer">
          <a target="_blank" href="https://github.com/nachomazzara/abitopic">
            {'{code} 👨‍💻'}
          </a>
        </div>
      </div>
    )
  }
}

export default App
