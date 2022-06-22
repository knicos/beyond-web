import React from 'react';
import { channels } from '@ftl/protocol';
import { components } from './components';

interface Props {
  channel: number;
  value: unknown;
  hideReadonly?: boolean;
  hideEditable?: boolean;
  onChange?: (channel: number, value: unknown) => void;
}

export function ChannelComponent({ channel, value, onChange, hideEditable, hideReadonly }: Props) {
  if ((channels as any).properties[`${channel}`] === undefined) {
    const dummyEntry = {
      title: `Channel ${channel}`,
      editable: true,
      component: 'EditableValue',
      type: 'string'
    };
    if (Array.isArray(value)) {
      dummyEntry.type = "array";
    } else {
      dummyEntry.type = typeof value;
    }

    (channels as any).properties[`${channel}`] = dummyEntry;
  }
  const schema = (channels as any).properties[`${channel}`];
  if (schema && (!hideEditable || !schema.editable) && (!hideReadonly || schema.editable)) {
    const Comp = components[schema.component] || components.RawValue;
    if (Comp) {
      return <Comp channel={channel} data={value} config={schema} onChange={onChange} />;
    }
  }

  return null;
}
