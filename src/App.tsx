import React, { Component } from 'react'
import logo from './logo.svg'

import './App.css'
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

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
      error: null,
      apiNetwork: `https://api${
        network === 'ropsten' ? `-${network}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network
    }
  }

  componentWillMount() {
    console.log(this.props)
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
      for (const method of validABI) {
        if (method.name && method.type === 'event') {
          const name = `${method.name}(${method.inputs
            .map((input: any) => input.type)
            .join(',')})`
          const signature = web3.utils.sha3(name)
          events.push({ name, signature })
        }
      }
      this.setState({ error: null, abi, events })
    } catch (e) {
      this.setState({ error: e.message })
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

  render() {
    const { events, abi, address, error, network } = this.state as any
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
          {'Get the events topics0 from a contract by the address or ABI'}
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
              onChange={this.getByABI}
              value={abi ? JSON.stringify(abi) : ''}
            />
          </div>
        </div>
        <p className="error">{error}</p>
        {events && (
          <div className="events">
            <h3>{'Events'}</h3>
            {events.map((event: any) => (
              <React.Fragment key={event.signature}>
                <div className="event">
                  <p>{`${event.name}`}</p>
                  <p>
                    {'[Topic0]'}
                    <textarea
                      readOnly
                      ref={textarea =>
                        (this.textarea[event.signature] = textarea)
                      }
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
