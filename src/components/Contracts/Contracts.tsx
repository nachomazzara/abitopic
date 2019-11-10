import React, { Component } from 'react'
import Dropdown, { Option } from 'react-dropdown'

import { getChains } from '../../lib/utils'
import Loader from '../../components/Loader' // @TODO: components as paths
import Contract from '../../components/Contract'
import { State } from './types'

import './Contracts.css'

export default class Contracts extends Component<any, State> {
  textarea: { [key: string]: any } = {}

  constructor(props: any) {
    super(props)

    const { network } = this.getInitParams()

    this.state = {
      apiNetwork: `https://api${
        network !== 'mainnet' ? `-${network}` : ''
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network
    }
  }

  getInitParams = () => {
    const searchParams = new URLSearchParams(window.location.search)
    // @TOOD: const lastUsed = getLastUsed()

    let network

    // if (lastUsed) {
    //   network = lastUsed.network
    // }

    return {
      network: searchParams.get('network') || network || 'mainnet'
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
      }.etherscan.io/api?module=contract&action=getabi&address=`,
      network: newNetwork
    })
  }

  render() {
    const { network, apiNetwork } = this.state

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
          <div>
            <Contract network={network} apiNetwork={apiNetwork} />
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
