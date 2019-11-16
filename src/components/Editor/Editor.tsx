import React, { PureComponent } from 'react'
import MonacoEditor from 'react-monaco-editor'

import { INITIAL_CODE } from '../../lib/utils'
import { saveLastUsedCode, getLastUsedCode } from '../../lib/localStorage'
import { Props, State } from './types'

import './Editor.css'

export default class Editor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      code: getLastUsedCode(props.index) || INITIAL_CODE,
      showEditor: false,
      isRunning: false,
      output: null
    }
  }

  handleToggleEditor = () => {
    this.setState({ showEditor: !this.state.showEditor })
  }

  handleCodeChange = (newValue: string) => {
    saveLastUsedCode(newValue, this.props.index)
    this.setState({ code: newValue })
  }

  executeCode = async () => {
    const { code } = this.state
    const { contract } = this.props
    let output
    try {
      this.setState({ output: null, isRunning: true })
      output = await eval(`${code}\nmain()`)
    } catch (e) {
      output = e.stack
    }

    this.setState({ output, isRunning: false })
  }

  resetCode = () => {
    this.handleCodeChange(INITIAL_CODE)
  }

  render() {
    const { code, output, isRunning, showEditor } = this.state
    return (
      <>
        {showEditor ? (
          <div className="Editor">
            <div className="run">
              <button onClick={this.handleToggleEditor} title="Hide">
                <i className="hide-icon" />
                {'Hide'}
              </button>
              <button onClick={this.executeCode} title="Run">
                <i className="run-icon" />
                {'Run'}
              </button>
              <button onClick={this.resetCode} title="Reset">
                <i className="run-icon" />
                {'Run'}
              </button>
            </div>
            <div className="code-wrapper">
              <MonacoEditor
                height="600"
                language="typescript"
                theme="vs-dark"
                value={code}
                onChange={this.handleCodeChange}
                options={{
                  automaticLayout: true,
                  lineNumbers: 'off',
                  minimap: { enabled: false }
                }}
              />
            </div>
            <div className="output-wrapper">
              <p>{'Output:'}</p>
              {isRunning && <p className="executing">{'Running....'}</p>}
              {output &&
                (typeof output === 'string' ? (
                  output
                ) : (
                  <pre> JSON.stringify(output, undefined, 2)} </pre>
                ))}
            </div>
          </div>
        ) : (
          <div className="custom-code">
            <button onClick={this.handleToggleEditor}>
              {'Try out: Custom code ✍ (BETA)'}
            </button>
          </div>
        )}
      </>
    )
  }
}
