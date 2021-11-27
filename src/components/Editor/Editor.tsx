import React, { PureComponent } from 'react'
import MonacoEditor from 'react-monaco-editor'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'

// @ts-ignore
import editorTypes from '!!raw-loader!./editorTypes.d.ts'
// @ts-ignore
import defaultScript from '!!raw-loader!./defaultScript.js'

import { saveLastUsedCode, getLastUsedCode } from '../../lib/localStorage'
import { typeContractMethods, isIOS } from '../../lib/utils'
import { Props, State } from './types'

import './Editor.css'
import { getWeb3Instance } from '../../lib/web3'

export const OUTPUT_HEADLINE = '/***** Output *****/\n'

export default class Editor extends PureComponent<Props, State> {
  textarea!: HTMLTextAreaElement
  textTimeout: number = 0

  constructor(props: Props) {
    super(props)

    this.state = {
      code: getLastUsedCode(props.index) || defaultScript,
      showEditor: false,
      isRunning: false,
      output: null,
      error: null,
      copyText: 'Copy'
    }
  }

  editorWillMount = (monaco: typeof monacoEditor) => {
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      typeContractMethods(editorTypes, this.props.contract!),
      'index.d.ts'
    )
  }

  editorDidMount = (
    editor: monacoEditor.editor.IStandaloneCodeEditor,
    monaco: typeof monacoEditor
  ) => {
    const model = editor.getModel()
    if (model && model.getModeId() === 'typescript') {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
        saveLastUsedCode(this.state.code, this.props.index)
        editor.trigger('format', 'editor.action.formatDocument', null)
      })
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.textTimeout)
  }

  handleExecuteCode = async () => {
    const { code } = this.state
    const { index, contract } = this.props // contract should be available when evaluating the script
    const web3 = getWeb3Instance() // web3 should be available when evaluating the script

    saveLastUsedCode(code, index)

    let output: string

    const setState = (...values: any) => {
      if (output === undefined) {
        output = ''
      }

      if (values.length > 1) {
        values.forEach(
          (value: any) => (output += JSON.stringify(value, null, 2) + '\n')
        )
      } else {
        output += JSON.stringify(values[0], null, 2) + '\n'
      }

      this.setState({ output })
    }

    try {
      this.setState({ isRunning: true, output: null, error: null })
      setState(
        await eval(`
       (function(){
          const console = {}

          console.log = function() {
            setState(...arguments)
          }
          ${code}
          return main()
        })()
      `)
      )

      this.setState({ isRunning: false })
    } catch (e) {
      this.setState({ error: e.stack, isRunning: false })
    }
  }

  handleToggleEditor = () => {
    this.setState({ showEditor: !this.state.showEditor })
  }

  handleCodeChange = (newValue: string) => {
    this.setState({ code: newValue })
  }

  handleResetCode = () => {
    this.handleCodeChange(defaultScript)
  }

  handleCopy = () => {
    this.setState({ copyText: 'Copied' })
    if (isIOS()) {
      const range = document.createRange()
      range.selectNodeContents(this.textarea)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      this.textarea.setSelectionRange(0, 999999)
    } else {
      this.textarea.select()
    }
    document.execCommand('copy')
    this.textTimeout = window.setTimeout(
      () => this.setState({ copyText: 'Copy' }),
      1000
    )
  }

  handleClearOutput = () => {
    this.setState({ output: null, error: null })
  }

  render() {
    const { code, output, isRunning, showEditor, error, copyText } = this.state

    let outputValue = OUTPUT_HEADLINE

    if (isRunning) {
      outputValue = 'Running...'
    } else if (output) {
      outputValue = output
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
                  <button onClick={this.handleExecuteCode} title="Run">
                    <i className="icon run" />
                    {'Run'}
                  </button>
                </div>
                <div className="col right">
                  <button onClick={this.handleResetCode} title="Reset">
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
                editorDidMount={this.editorDidMount}
                options={{
                  automaticLayout: true,
                  lineNumbers: 'off',
                  minimap: { enabled: false },
                  fontSize: 11
                }}
              />
            </div>
            <div className="output-wrapper">
              <div className="actions">
                <div className="col left">
                  <button onClick={this.handleCopy} title="Copy">
                    <i className="icon copy" />
                    {copyText}
                  </button>
                </div>
                <div className="col right">
                  <button onClick={this.handleClearOutput} title="Clear">
                    <i className="icon reset" />
                    {'Clear'}
                  </button>
                </div>
              </div>
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
        <textarea
          readOnly={true}
          className="no-visible"
          ref={textarea => {
            if (textarea) {
              this.textarea = textarea
            }
          }}
          value={outputValue}
        />
      </>
    )
  }
}
