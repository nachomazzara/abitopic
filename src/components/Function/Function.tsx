import React, { PureComponent } from 'react'

import { Func, FunctionProps } from './types'
import Transaction from '../../components/Transaction' // @TODO: components as paths
import Text from '../../components/Text' // @TODO: components as paths'

export default class Function extends PureComponent<FunctionProps> {
  render() {
    const { func, contract } = this.props

    return (
      <React.Fragment>
        <div className="result">
          <p>{func.name}</p>
          <p className="original">{func.original}</p>
          <p>
            {'[Selector]'}
            <Text text={func.selector} />
          </p>
          {func.inputs && (
            <Transaction
              funcName={func.name}
              inputs={func.inputs}
              outputs={func.outputs}
              isConstant={func.isConstant}
              contract={contract}
            />
          )}
        </div>
      </React.Fragment>
    )
  }
}
