import { Props as ModalProps } from '../types'
import { mulitisigTx } from '../../Function/types'

export type Props = ModalProps & {
  transaction: mulitisigTx
}
