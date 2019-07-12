import React, { PureComponent } from 'react'

import { TransactionProps, TransactionState } from './types'
import Text from '../../components/Text' // @TODO: components as paths'

import './Transaction.css'

export default class Transaction extends PureComponent<
  TransactionProps,
  TransactionState
> {
  constructor(props: TransactionProps) {
    super(props)
    this.state = { data: '', error: null }
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

    const { contract, funcName } = this.props
    const data = this.getData(event)
    if ((window as any).ethereum) {
      try {
        await (window as any).ethereum.enable()
        const web3 = (window as any).web3
        console.log(contract)
        web3.eth.sendTransaction(
          {
            from: web3.eth.defaultAccount,
            to: contract.options.address,
            data
          },
          (err: string, res: string) => {
            console.log(err, res)
          }
        )
      } catch (e) {
        console.log(e.message)
      }
    }
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
    const { data, error } = this.state
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
        {data && <Text text={data} className={'data'} />}
      </React.Fragment>
    )
  }
}
