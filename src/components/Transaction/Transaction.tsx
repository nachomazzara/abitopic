import React, { PureComponent } from 'react'

import { TransactionProps, TransactionState, EthereumWindow } from './types'
import Text from '../../components/Text' // @TODO: components as paths'
import './Transaction.css'

const Web3 = require('web3')
const network =
  new URLSearchParams(window.location.search).get('network') || 'mainnet'

export default class Transaction extends PureComponent<
  TransactionProps,
  TransactionState
> {
  constructor(props: TransactionProps) {
    super(props)
    this.state = { data: '', link: '', error: null }
  }

  toArrayInput = (input: string) =>
    input
      .replace(/ /g, '')
      .replace('[', '')
      .replace(']', '')
      .split(',')

  showTxData = (event: React.FormEvent<any>) => {
    event.preventDefault()
    this.setState({
      data: this.getData(event),
      error: null
    })
  }

  sendTxData = async (event: React.FormEvent<any>) => {
    event.preventDefault()

    const { contract, funcName, isConstant } = this.props
    const { ethereum, web3 } = window as EthereumWindow
    const fn = isConstant ? web3.eth.call : web3.eth.sendTransaction
    const data = this.getData(event)

    if (ethereum !== undefined && typeof ethereum.enable === 'function') {
      try {
        const net = web3.version.network
        if (network === 'ropsten' && net !== '3') {
          throw new Error('You are in mainnet! switch your wallet to Ropsten')
        }
        await ethereum.enable()

        const res: string = await new Promise((resolve, reject) =>
          fn(
            {
              from: web3.eth.defaultAccount,
              to: contract.options.address,
              data
            },
            (error: string, res: string) => {
              if (error) {
                reject(error)
              }

              resolve(res)
            }
          )
        )

        if (isConstant) {
          this.setState({
            data: this.getCall(res),
            error: null
          })
        } else {
          this.setState({
            link: this.getLink(res),
            error: null
          })
        }
      } catch (e) {
        this.setState({
          link: '',
          error: e.message
        })
      }
    }
  }

  getCall = (data: string): string => {
    const { outputs } = this.props

    const web3Proxy = new Web3(
      new Web3.providers.HttpProvider('http://localhost:8545')
    )
    const decodedData = web3Proxy.eth.abi.decodeParameters(
      outputs.map(input => input.type),
      data
    )

    return Object.keys(decodedData)
      .map(
        (key: string, index: number) =>
          `${
            outputs[index].name ? outputs[index].name : outputs[index].type
          }: ${decodedData[key]}\n`
      )
      .join('')
  }

  getLink = (txHash: string) => {
    return `https://${
      network === 'ropsten' ? `${network}.` : ''
    }etherscan.io/tx/${txHash}`
  }

  getData = (event: React.FormEvent<any>) => {
    const { contract, funcName } = this.props
    const elements = event.currentTarget.form
    const params = []
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (element.name.indexOf('[') !== -1) {
        params.push(this.toArrayInput(element.value))
      } else if (element.type === 'text') {
        params.push(element.value)
      }
    }
    try {
      return contract.methods[funcName](...params).encodeABI()
    } catch (e) {
      this.setState({
        data: '',
        error: e.message
      })
    }
  }

  render() {
    const { data, link, error } = this.state
    const { inputs } = this.props

    return (
      <React.Fragment>
        <form>
          {inputs.map((input, index: number) => (
            <div key={index} className="input-row">
              <label>{input.name}</label>
              <input
                key={index}
                type="text"
                name={input.type}
                placeholder={`${input.name} <${input.type}>`}
              />
            </div>
          ))}
          <button type="submit" onClick={this.showTxData}>
            {'Get raw data'}
          </button>
          <button type="submit" onClick={this.sendTxData}>
            {'Send Transaction'}
          </button>
        </form>
        {error && <p className="data error">{error}</p>}
        {data && <Text text={data} className="data" />}
        {link && (
          <a href={link} target="_blank" className="tx-link">
            {link}
          </a>
        )}
      </React.Fragment>
    )
  }
}
