import React, { PureComponent } from 'react'
import { TransactionReceipt } from 'web3-core/types'

import { TransactionProps, TransactionState, TxData } from './types'
import Text from '../../components/Text' // @TODO: components as paths'
import { getWeb3Instance, getDefaultAccount } from '../../lib/web3'
import {
  getTxLink,
  getNetworkNameById,
  getMultisigContract,
  isMultisigTx,
  CUSTOM_NETWORK,
  MULTISIG_ELEMENT_NAME
} from '../../lib/utils'
import './Transaction.css'

export default class Transaction extends PureComponent<
  TransactionProps,
  TransactionState
> {
  web3 = getWeb3Instance()
  network =
    new URLSearchParams(window.location.search).get('network') || 'mainnet'

  constructor(props: TransactionProps) {
    super(props)
    this.state = { data: '', link: '', showMultisig: false, error: null }
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
      const { data } = this.getData(event.currentTarget.form)
      this.setState({
        data: data,
        error: null
      })
    } catch (e) {
      this.setState({
        data: '',
        error:
          e instanceof Error
            ? e.message
            : `An error has occured ${JSON.stringify(e)}`
      })
    }
  }

  sendTxData = async (event: React.FormEvent<any>) => {
    event.preventDefault()

    const { contract, isConstant, blockNumber } = this.props
    const web3 = getWeb3Instance()

    try {
      const { data, value } = this.getData(event.currentTarget.form)
      const from = await getDefaultAccount()

      const transaction = {
        to: contract.options.address,
        from,
        data,
        value
      }

      if (!(await this.isSameNetwork())) {
        throw new Error(
          `Your wallet is not on ${this.network}. Please, switch your wallet to ${this.network} if you want to interact with the contract.`
        )
      }

      const res = await (isConstant
        ? web3.eth.call(transaction, blockNumber)
        : web3.eth.sendTransaction(transaction))

      if (isConstant) {
        this.setState({
          data: this.getCall(res as string),
          error: null
        })
      } else {
        this.setState({
          link: this.getLink(res as TransactionReceipt),
          error: null
        })
      }
    } catch (e) {
      this.setState({
        data: '',
        link: '',
        error:
          e instanceof Error
            ? e.message
            : `An error has occured ${JSON.stringify(e)}`
      })
    }
  }

  sendTxDataWithMultisig = async (event: React.FormEvent<any>) => {
    event.preventDefault()

    const { contract } = this.props
    const web3 = getWeb3Instance()

    try {
      const form = event.currentTarget.form
      const { data, value, multisigAddress } = this.getData(form)
      const from = await getDefaultAccount()

      if (!multisigAddress) {
        throw new Error('Multisig address is missing')
      }

      const multisigContract = getMultisigContract(multisigAddress)

      const transaction = {
        to: multisigAddress,
        data: multisigContract.methods
          .submitTransaction(contract.options.address, value, data)
          .encodeABI(),
        from,
        value
      }

      if (!(await this.isSameNetwork())) {
        throw new Error(
          `Your wallet is not on ${this.network}. Please, switch your wallet to ${this.network} if you want to interact with the contract.`
        )
      }

      const res = await web3.eth.sendTransaction(transaction)

      this.setState({
        link: this.getLink(res as TransactionReceipt),
        error: null
      })
    } catch (e) {
      this.setState({
        data: '',
        link: '',
        error:
          e instanceof Error
            ? e.message
            : `An error has occured ${JSON.stringify(e)}`
      })
    }
  }

  showMultisig = () => {
    this.setState({ showMultisig: !this.state.showMultisig })
  }

  isSameNetwork = async (): Promise<boolean> => {
    const netId = await this.web3.eth.net.getId()
    return (
      this.network === CUSTOM_NETWORK ||
      this.network === getNetworkNameById(netId)
    )
  }

  getCall = (data: string): string => {
    const { outputs } = this.props

    const decodedData = this.web3.eth.abi.decodeParameters(
      outputs.map(input => input.type),
      data
    )

    return Object.keys(decodedData)
      .filter((_, index) => outputs[index])
      .map(
        (key: string, index: number) =>
          `${
            outputs[index].name ? outputs[index].name : outputs[index].type
          }: ${decodedData[key]}\n`
      )
      .join('')
  }

  getLink = (receipt: TransactionReceipt) => {
    return `${getTxLink(this.network)}/${receipt.transactionHash}`
  }

  getData = (elements: React.InputHTMLAttributes<any>[]): TxData => {
    const { contract, funcName, isPayable } = this.props
    let multisigAddress = ''
    const params = []
    let value = '0'

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      if (!element.name || !element.value) {
        continue
      }

      if (element.name === MULTISIG_ELEMENT_NAME) {
        multisigAddress = element.value.toString()
        continue
      }

      if (isPayable && i === 0 && element.value) {
        value = this.web3.utils.toWei(element.value.toString()).toString()
        continue
      }

      if (element.name === 'bool') {
        params.push(
          element.value.toString().toLowerCase() !== 'false' &&
            element.value.toString().toLowerCase() !== '0'
        )
        continue
      }

      if (element.name.indexOf('[') !== -1) {
        params.push(this.toArrayInput(element.value.toString()))
      } else if (element.type === 'text') {
        params.push(element.value)
      }
    }

    return {
      data: contract.methods[funcName](...params).encodeABI(),
      value,
      multisigAddress
    }
  }

  render() {
    const { data, link, showMultisig, error } = this.state
    const { isPayable, inputs, isConstant, funcName } = this.props

    const isMultisigTransaction = isMultisigTx(funcName)

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
            <div key={`${funcName}-${index}`} className="input-row">
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
            {isConstant ? 'Query' : 'Send Transaction'}
          </button>
          {!isConstant && !isMultisigTransaction && (
            <>
              <button type="button" onClick={this.showMultisig}>
                {'Send with legacy Gnosis multisig'}
              </button>
              {showMultisig && (
                <>
                  <div key={`${funcName}-multisig`} className="input-row">
                    <label>{MULTISIG_ELEMENT_NAME}</label>
                    <input
                      key={`${funcName}-multisig-address`}
                      type="text"
                      name={MULTISIG_ELEMENT_NAME}
                      placeholder={`0x1234....`}
                    />
                  </div>
                  <button type="submit" onClick={this.sendTxDataWithMultisig}>
                    {'Send Transaction'}
                  </button>
                </>
              )}
            </>
          )}
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
