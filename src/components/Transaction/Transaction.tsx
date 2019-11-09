import React, { PureComponent } from 'react'

import {
  TransactionProps,
  TransactionState,
  EthereumWindow,
  TxData
} from './types'
import Text from '../../components/Text' // @TODO: components as paths'
import './Transaction.css'

const Web3 = require('web3')

export default class Transaction extends PureComponent<
  TransactionProps,
  TransactionState
> {
  network =
    new URLSearchParams(window.location.search).get('network') || 'mainnet'

  constructor(props: TransactionProps) {
    super(props)
    this.state = { data: '', link: '', error: null }
  }

  componentWillReceiveProps() {
    this.network =
      new URLSearchParams(window.location.search).get('network') || 'mainnet'
  }

  toArrayInput = (input: string) =>
    input
      .replace(/ /g, '')
      .replace('[', '')
      .replace(']', '')
      .split(',')

  showTxData = (event: React.FormEvent<any>) => {
    event.preventDefault()
    try {
      const { data } = this.getData(event)
      this.setState({
        data: data,
        error: null
      })
    } catch (e) {
      this.setState({
        data: '',
        error: e.message
      })
    }
  }

  sendTxData = async (event: React.FormEvent<any>) => {
    event.preventDefault()

    const { contract, isConstant, blockNumber } = this.props
    const { ethereum, web3 } = window as EthereumWindow
    const fn = isConstant ? web3.eth.call : web3.eth.sendTransaction

    try {
      const { data, value } = this.getData(event)

      const params: any = [
        {
          from: web3.eth.defaultAccount,
          to: contract.options.address,
          data,
          value
        }
      ]

      if (isConstant) {
        params.push(blockNumber)
      }

      if (ethereum !== undefined && typeof ethereum.enable === 'function') {
        const net = web3.version.network
        if (
          (this.network === 'ropsten' && net !== '3') ||
          (this.network === 'mainnet' && net !== '1')
        ) {
          throw new Error(
            `Your wallet is not on ${this.network}. Please, switch your wallet to ${this.network} if you want to interact with the contract.`
          )
        }
        await ethereum.enable()

        const res: string = await new Promise((resolve, reject) =>
          fn(...params, (error: string, res: string) => {
            if (error) {
              reject(error)
            }

            resolve(res)
          })
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
      }
    } catch (e) {
      this.setState({
        data: '',
        link: '',
        error: e.message
      })
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
      this.network !== 'mainnet' ? `${this.network}.` : ''
    }etherscan.io/tx/${txHash}`
  }

  getData = (event: React.FormEvent<any>): TxData => {
    const { contract, funcName, isPayable } = this.props
    const elements = event.currentTarget.form
    const params = []
    let value = '0'

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (isPayable && i === 0) {
        const { web3 } = window as EthereumWindow
        console.log(web3)
        value = web3.toWei(element.value)
        continue
      }
      if (element.name.indexOf('[') !== -1) {
        params.push(this.toArrayInput(element.value))
      } else if (element.type === 'text') {
        params.push(element.value)
      }
    }

    return { data: contract.methods[funcName](...params).encodeABI(), value }
  }

  render() {
    const { data, link, error } = this.state
    const { isPayable, inputs, outputs, funcName } = this.props

    return (
      <React.Fragment>
        <form>
          {isPayable && (
            <div key={`${funcName}-value`} className="input-row">
              <label>{'value (Ether)'}</label>
              <input
                key={`${funcName}-value`}
                type="text"
                name="uint256"
                placeholder={`payable amount <uint256>`}
              />
            </div>
          )}
          {inputs.map((input, index: number) => (
            <div key={index} className="input-row">
              <label>{input.name}</label>
              <input
                key={`${funcName}-${index}`}
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
            {outputs.length > 0 ? 'Query' : 'Send Transaction'}
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
