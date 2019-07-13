import { Type } from '../../components/Transaction/types'

export type Func = {
  name: string
  original: any
  selector: string
  isConstant: boolean
  outputs: Type[]
  inputs: Type[]
}

export type FunctionProps = {
  func: Func
  contract: any
}
