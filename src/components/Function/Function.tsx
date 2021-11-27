import React, { PureComponent } from 'react'

import { FunctionProps, FunctionState, mulitisigTx } from './types'
import Transaction from '../../components/Transaction' // @TODO: components as paths
import Text from '../../components/Text' // @TODO: components as paths'
import { MultisigTxInfoModal } from '../../components/Modals'
import { isConfirmMultisigTx } from '../../lib/utils'

import './Function.css'

export default class Function extends PureComponent<FunctionProps, FunctionState> {
  mounted: boolean = false

  constructor(props: FunctionProps) {
    super(props)
    this.state = { pendingTxIds: [], currentMultisigTx: null, isModalOpen: false }
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
            pendingTxIds.push({
              id: i,
              to: tx.destination,
              value: tx.value,
              data: tx.data
            })
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

  showMultisigTxInfoModal = (currentMultisigTx: mulitisigTx) => {
    this.setState({isModalOpen: true , currentMultisigTx })
    this.toggleModal()
  }

  toggleModal = () =>  {
    this.setState({isModalOpen: !this.state.isModalOpen })
  }

  async componentWillUnmount() {
    this.mounted = false
  }


  render() {
    const { pendingTxIds, isModalOpen, currentMultisigTx } = this.state
    const { func, contract, blockNumber } = this.props
    const isConfirmTx = isConfirmMultisigTx(func.name)

    return (
      <React.Fragment>
        <div className="result">
          <p>{func.name}</p>
          <p className="original">{func.original}</p>
          <p>
            {'[Selector]'}
            <Text text={func.selector} />
          </p>
          {isConfirmTx && pendingTxIds.length > 0 && <div className="multisig-txs-wrapper">
            <p className="confirm-tx">{`Pending txs to confirm: `}</p>
            {pendingTxIds.map(tx => <button type="button" key={tx.id} className="multisig-tx-info" onClick={() => this.showMultisigTxInfoModal(tx)}>{tx.id}</button>)}
            </div>
          }
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
        {isModalOpen && currentMultisigTx && <MultisigTxInfoModal onClose={this.toggleModal} transaction={currentMultisigTx} />}
      </React.Fragment>
    )
  }
}
