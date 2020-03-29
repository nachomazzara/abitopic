import React, { Component } from 'react'
import Dropdown, { Option } from 'react-dropdown'

import { getChains, ETHERSCAN_API_KEY } from '../../lib/utils'
import Contract from '../../components/Contract'
import { State } from './types'

import './Contracts.css'
import { getLastUsedNetwork } from '../../lib/localStorage'

export default class Contracts extends Component<any, State> {
  textarea: { [key: string]: any } = {}

  constructor(props: any) {
    super(props)

    const { network } = this.getInitParams()

    this.state = {
      apiNetwork: `https://api${
        network !== 'mainnet' ? `-${network}` : ''
      }.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}&module=contract&action=getabi&address=`,
      contracts: 1,
      network
    }
  }

  getInitParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const network = getLastUsedNetwork()

    return {
      network: searchParams.get('network') || network
    }
  }

  changeNetwork = (option: Option) => {
    const { network } = this.props

    const newNetwork = option.value

    history.pushState(
      network,
      newNetwork,
      `${window.location.origin}?network=${newNetwork}`
    )

    this.setState({
      apiNetwork: `https://api${
        newNetwork !== 'mainnet' ? `-${newNetwork}` : ''
      }.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}&module=contract&action=getabi&address=`,
      network: newNetwork
    })
  }

  add = () => {
    this.setState({ contracts: this.state.contracts + 1 })
  }

  render() {
    const { network, apiNetwork, contracts } = this.state

    const chains = getChains()
    return (
      <>
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
          <button style={{ display: 'none' }} onClick={this.add}>
            {'Add'}
          </button>
          <div style={{ display: 'none' }}>
            {Array.from(Array(contracts)).map((_, index) => (
              <div key={index}>{index}</div>
            ))}
          </div>
          <div>
            {Array.from(Array(contracts)).map((_, index) => (
              <div
                key={index}
                style={{ display: index === 0 ? 'block' : 'none' }}
              >
                <Contract
                  index={index}
                  network={network}
                  apiNetwork={apiNetwork}
                />
              </div>
            ))}
          </div>
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
