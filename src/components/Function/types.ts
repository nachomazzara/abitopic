import { Input } from '../../components/Transaction/types'

export type Func = {
  name: string
  original: any
  selector: string
  inputs: Input[]
}

export type FunctionProps = {
  func: Func
  contract: any
}
