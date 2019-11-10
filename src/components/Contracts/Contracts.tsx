import React, { Component } from 'react'
import Dropdown from 'react-dropdown'

import { getChains } from '../../lib/utils'
import Loader from '../../components/Loader' // @TODO: components as paths
import Contract from '../../components/Contract'

import 'react-dropdown/style.css'
import './Contracts.css'

export default class Contracts extends Component<any, any> {
  textarea: { [key: string]: any } = {}

  constructor(props: any) {
    super(props)
  }

  changeNetwork = () => {}

  render() {
    const { network, isLoading } = this.state

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
            <Contract />
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
