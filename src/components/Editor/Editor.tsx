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

export const OUTPUT_HEADLINE = '/***** Output *****/\n'

export default class Editor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      code: getLastUsedCode(props.index) || defaultScript,
      showEditor: false,
      isRunning: false,
      output: null,
      error: null
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
    const uri = monacoEditor.Uri.parse('file://global.d.ts')
    const existingModel = monaco.editor.getModel(uri)

    if (!existingModel) {
      monaco.editor.createModel(editorTypes, 'typescript', uri)
    }
  }

  executeCode = async () => {
    const { code } = this.state
    const { contract } = this.props // should be available when evaluating the script

    let output
    try {
      this.setState({ isRunning: true, output: null, error: null })
      output = await eval(`${code}\nmain()`)
      this.setState({ output, isRunning: false })
    } catch (e) {
      this.setState({ error: e.stack, isRunning: false })
    }
  }

  resetCode = () => {
    this.handleCodeChange(defaultScript)
  }

  render() {
    const { code, output, isRunning, showEditor, error } = this.state

    let outputValue = OUTPUT_HEADLINE

    if (isRunning) {
      outputValue = 'Running...'
    } else if (output) {
      outputValue = JSON.stringify(output, null, 2)
    } else if (error) {
      outputValue = error
    }

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
                  minimap: { enabled: false },
                  fontSize: 11
                }}
              />
            </div>
            <div className="output-wrapper">
              <MonacoEditor
                height="600"
                language="typescript"
                theme="vs-dark"
                value={outputValue}
                options={{
                  readOnly: true,
                  automaticLayout: true,
                  lineNumbers: 'off',
                  minimap: { enabled: false },
                  fontSize: 10,
                  folding: false
                }}
              />
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
