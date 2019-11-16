import React, { PureComponent } from 'react'
import MonacoEditor from 'react-monaco-editor'

import { INITIAL_CODE } from '../../lib/utils'
import { Props, State } from './types'

export default class Editor extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      code: INITIAL_CODE,
      output: null
    }
  }

  editorWillMount = (monaco: any) => {
    //@TODO: ver types

    monaco.languages.typescript.javascriptDefaults.addExtraLib(
      `
      declare var contract
      declare interface Window {
        myNamespace?: MyNamespace & typeof MyNamespace
        contract: string
    }
    declare var window: {
    myNamespace?: string
    contract: any
  }
  const contract = ${this.props.contract}
  export default contract`,
      'globalssss.ts'
    )
    //     monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    //       validate: true,
    //       schemas: [
    //         {
    //           uri: 'http://myserver/foo-schema.json',
    //           fileMatch: ['*'],
    //           schema: {
    //             type: 'object',
    //             properties: {
    //               p1: {
    //                 enum: ['v1', 'v2']
    //               },
    //               p2: {
    //                 $ref: 'http://myserver/bar-schema.json'
    //               }
    //             }
    //           }
    //         }
    //       ]
    //     })
  }

  handleCodeChange = (newValue: string, e: any) => {
    //@TODO: type
    this.setState({ code: newValue })
  }

  executeCode = async () => {
    const { code } = this.state
    const { contract } = this.props
    console.log(code)
    try {
      eval(
        `console.log(contract)
         async function abitopicExecute() {
            ${code}
        }
        new Promise(async (res, rej) => {
          try {
            const output = await abitopicExecute()
            this.setState({ output })
            res()
          } catch (e) {
            rej(e)
          }
        })`
      )
    } catch (e) {
      console.log(e.message)
    }
  }

  render() {
    const { code, output } = this.state
    return (
      <>
        <MonacoEditor
          height="600"
          language="typescript"
          theme="vs-dark"
          value={code}
          onChange={this.handleCodeChange}
          editorWillMount={this.editorWillMount}
        />
        <button onClick={this.executeCode}>{'Execute'}</button>
        {output && <p>{output}</p>}
      </>
    )
  }
}
