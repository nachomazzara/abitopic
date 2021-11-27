import React, { PureComponent } from 'react'

import { FunctionProps, FunctionState } from './types'
import Transaction from '../../components/Transaction' // @TODO: components as paths
import Text from '../../components/Text' // @TODO: components as paths'
import { isConfirmMultisigTx } from '../../lib/utils'

import './Function.css'

export default class Function extends PureComponent<FunctionProps, FunctionState> {
  mounted: boolean = false

  constructor(props: FunctionProps) {
    super(props)
    this.state = { pendingTxIds: [] }
  }

  componentDidMount() {
    this.mounted = true

    if (isConfirmMultisigTx(this.props.func.name)) {
      this.fetchMultisigTx()
    }
  }

  fetchMultisigTx = async () => {
    const { contract} = this.props
    const pendingTxIds = []

    try {
    const txCount = await contract.methods.transactionCount().call()
    if (txCount > 0) {
      for (let i = 0; i < txCount; i++) {
          const tx = await contract.methods.transactions(i).call()
          if (!tx.executed) {
            pendingTxIds.push(i)
          }
        }
      }

      if (this.mounted) {
        this.setState({ pendingTxIds })
      }
    } catch(e) {
        console.log('Failed to load pending multisig transactions')
        setTimeout(this.fetchMultisigTx, 30 * 1000)
    }
  }

  async componentWillUnmount() {
    this.mounted = false
  }


  render() {
    const { pendingTxIds } = this.state
    const { func, contract, blockNumber } = this.props
    const isConfirmTx = isConfirmMultisigTx(func.name)
    console.log(isConfirmTx, pendingTxIds)
    return (
      <React.Fragment>
        <div className="result">
          <p>{func.name}</p>
          <p className="original">{func.original}</p>
          <p>
            {'[Selector]'}
            <Text text={func.selector} />
          </p>
          { isConfirmTx && pendingTxIds.length > 0 && <p className="confirm-tx">{`Pending txs to confirm: ${pendingTxIds.join(', ')}`}</p>}
          {func.inputs && (
            <Transaction
              funcName={func.name}
              inputs={func.inputs}
              outputs={func.outputs}
              contract={contract}
              blockNumber={blockNumber}
              isConstant={func.isConstant}
              isPayable={func.isPayable}
            />
          )}
        </div>
      </React.Fragment>
    )
  }
}
