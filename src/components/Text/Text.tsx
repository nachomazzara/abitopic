import React, { PureComponent } from 'react'

import Transaction from '../../components/Transaction' // @TODO: components as paths
import { TextProps } from './types'

export default class Text extends PureComponent<TextProps> {
  textarea: { [key: string]: any } = {}

  copyTopic = () => {
    this.textarea[this.props.text].select()
    document.execCommand('copy')
  }

  render() {
    const { text, className } = this.props

    return (
      <React.Fragment>
        <textarea
          readOnly
          ref={textarea => {
            if (textarea) {
              textarea!.style.height = textarea!.scrollHeight + 'px'
              this.textarea[text] = textarea
            }
          }}
          value={text}
          className={className || ''}
        />
        <button className="copy-button" onClick={this.copyTopic}>
          {'[copy]'}
        </button>
      </React.Fragment>
    )
  }
}
