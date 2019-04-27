export type Input = { type: string; name: string }

export type TransactionProps = {
  funcName: string
  inputs: Input[]
  contract: any
}
export type TransactionState = { data: string; error: string | null }
