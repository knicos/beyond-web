import React from 'react';
import { Form, ButtonBar } from '../../components/Form';
import { Formik, Field } from 'formik';
import {Dialog} from '../../components/Dialog';

interface Props {
  show: boolean;
  onClose: () => void;
  onSave: (v: any) => void;
}

export function NewConfigDialog({show, onClose, onSave }: Props) {
  return (
    <Dialog show={show}>
      <Formik
        initialValues={{
            channel: 64,
        }}
        enableReinitialize={true}
        onSubmit={(values) => onSave(values.channel)}
      >
        {({ isSubmitting }) => (
          <Form id="collectionform">
            <fieldset>
              <legend>New Configuration</legend>
              <Field type="number" name="channel" />
            </fieldset>

            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Add
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
