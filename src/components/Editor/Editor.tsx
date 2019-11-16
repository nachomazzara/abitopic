import React, { PureComponent } from 'react'
import MonacoEditor from 'react-monaco-editor'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'

// @ts-ignore
import editorTypes from '!!raw-loader!./editorTypes.d.ts'
// @ts-ignore
import defaultScript from '!!raw-loader!./defaultScript.js'

import { saveLastUsedCode, getLastUsedCode } from '../../lib/localStorage'
import { Props, State } from './types'

import './Editor.css'

export default class Editor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      code: getLastUsedCode(props.index) || defaultScript,
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

  editorWillMount = (monaco: typeof monacoEditor) => {
    monaco.editor.createModel(
      editorTypes,
      'typescript',
      monacoEditor.Uri.parse('file://global.d.ts')
    )
  }

  executeCode = async () => {
    const { code } = this.state
    const { contract } = this.props // should be available when evaluating the script

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
    this.handleCodeChange(defaultScript)
  }

  render() {
    const { code, output, isRunning, showEditor } = this.state
    return (
      <>
        {showEditor ? (
          <div className="Editor">
            <div className="code-wrapper">
              <div className="actions">
                <div className="col left">
                  <button onClick={this.handleToggleEditor} title="Hide">
                    <i className="icon hide" />
                    {'Hide'}
                  </button>
                  <button onClick={this.executeCode} title="Run">
                    <i className="icon run" />
                    {'Run'}
                  </button>
                </div>
                <div className="col right">
                  <button onClick={this.resetCode} title="Reset">
                    <i className="icon reset" />
                    {'Reset'}
                  </button>
                </div>
              </div>
              <MonacoEditor
                height="600"
                language="typescript"
                theme="vs-dark"
                value={code}
                onChange={this.handleCodeChange}
                editorWillMount={this.editorWillMount}
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
