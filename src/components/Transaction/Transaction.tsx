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

  showTxData = (event: any) => {
    event.preventDefault()
    const { data } = this.state
    const { contract, funcName } = this.props

    const elements = event.target.elements
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
      const data = contract.methods[funcName](...params).encodeABI()
      this.setState({
        data,
        error: null
      })
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
        <form onSubmit={this.showTxData}>
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
          <button type="submit">{'Get raw data'}</button>
        </form>
        {error && <p className="data error">{error}</p>}
        {data && <Text text={data} className={'data'} />}
      </React.Fragment>
    )
  }
}
