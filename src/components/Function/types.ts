import { Type } from '../../components/Transaction/types'

export type Func = {
  name: string
  original: any
  selector: string
  outputs: Type[]
  inputs: Type[]
  isConstant: boolean
  isPayable: boolean
}

export type FunctionProps = {
  func: Func
  contract: any
  blockNumber: string
}
