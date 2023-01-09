import React from 'react';
import { ICreateRecording } from '../../api/recorder';
import { Dialog } from '../../components/Dialog';
import { Form, ButtonBar } from '../../components/Form';
import { Formik, Field } from 'formik';
import styled from 'styled-components';
import { FTLStream } from '@ftl/stream';

interface Props {
  stream: FTLStream;
  show: boolean;
  onRecord: (data: ICreateRecording) => void;
  onClose: () => void;
}

export function RecordDialog({ show, onRecord, onClose, stream }: Props) {
  return (
    <Dialog show={show} >
      <Formik
        initialValues={{
            depth: false,
            colour: true,
            overlay: false,
        }}
        enableReinitialize={true}
        onSubmit={(values) => onRecord({
          streams: [stream.uri],
          channels: [
            ...(values.depth && [1] || []),
            ...(values.colour && [0] || []),
          ]
        })}
      >
        {({ isSubmitting }) => (
          <Form id="collectionform">
            <fieldset>
              <legend>Choose Channels</legend>
              <label htmlFor="depth">Depth</label>
              <Field type="checkbox" name="depth" />
              <label htmlFor="colour">Colour</label>
              <Field type="checkbox" name="colour" />
              <label htmlFor="overlay">Overlay</label>
              <Field type="checkbox" name="overlay" />
            </fieldset>

            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Record
              </button>
              <button type="button" onClick={() => onClose()}>
                Cancel
              </button>
            </ButtonBar>
          </Form>
        )}
      </Formik>
    </Dialog>
  )
}
