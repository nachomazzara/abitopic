import React, { useState, useEffect, useCallback, useContext } from 'react'

import Modal from '../Modal'
import { Props } from './types'
import { isIOS } from '../../../lib/utils'

import './MultisigTxInfoModal.css'

export default function MultisigTxInfoModal(props: Props) {
  const { transaction } = props

  let toTextareaRef: HTMLTextAreaElement
  let valueTextareaRef: HTMLTextAreaElement
  let dataTextareaRef: HTMLTextAreaElement

  function handleCopy(textareaRef: HTMLTextAreaElement) {
    if (isIOS()) {
      const range = document.createRange()
      range.selectNodeContents(textareaRef)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      textareaRef.setSelectionRange(0, 999999)
    } else {
      textareaRef.select()
    }

    document.execCommand('copy')
  }

  return (
    <Modal
      onClose={props.onClose}
      className="MultisigTxInfoModal"
      title={`Transaction #${transaction.id}`}
    >
      <div>
        <div className="input-wrapper">
          <h3>{'To'}</h3>
          <p>{transaction.to}</p>
          <textarea
            readOnly={true}
            className="no-visible"
            ref={textarea => {
              if (textarea) {
                toTextareaRef = textarea
              }
            }}
            value={transaction.to}
          />
          <button onClick={() => handleCopy(toTextareaRef)}>{`copy`}</button>
        </div>
        <div className="input-wrapper">
          <h3>{'Value'}</h3>
          <p>{transaction.value}</p>
          <textarea
            readOnly={true}
            className="no-visible"
            ref={textarea => {
              if (textarea) {
                valueTextareaRef = textarea
              }
            }}
            value={transaction.value}
          />
          <button onClick={() => handleCopy(valueTextareaRef)}>{`copy`}</button>
        </div>
        <div className="input-wrapper">
          <h3>{'Data'}</h3>
          <p>{transaction.data}</p>
          <textarea
            readOnly={true}
            className="no-visible"
            ref={textarea => {
              if (textarea) {
                dataTextareaRef = textarea
              }
            }}
            value={transaction.data}
          />
          <button onClick={() => handleCopy(dataTextareaRef)}>{`copy`}</button>
        </div>
      </div>
    </Modal>
  )
}
