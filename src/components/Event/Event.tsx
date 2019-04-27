import React, { PureComponent } from 'react'

import { Event as EventType, EventProps } from './types'
import Text from '../../components/Text' // @TODO: components as paths'

export default class Event extends PureComponent<EventProps> {
  render() {
    const { event } = this.props

    return (
      <React.Fragment>
        <div className="result">
          <p>{event.name}</p>
          <p className="original">{event.original}</p>
          <p>
            {'[Topic0]'}
            <Text text={event.signature} />
          </p>
        </div>
      </React.Fragment>
    )
  }
}
