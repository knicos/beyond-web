import React from 'react';
import { Form, ButtonBar } from '../../components/Form';
import { Formik, Field } from 'formik';
import {Dialog} from '../../components/Dialog';

interface Props {
  target: any;
  onClose: () => void;
  onSave: (v: any) => void;
}

export function ConfigDialog({target, onClose, onSave }: Props) {
  if (!target) {
    return null;
  }

  return (
    <Dialog show={!!target}>
      <Formik
        initialValues={{
            title: target.title || '',
            value: target.value || '',
            channel: target.channel,
        }}
        enableReinitialize={true}
        onSubmit={onSave}
      >
        {({ isSubmitting }) => (
          <Form id="collectionform">
            <fieldset>
              <legend>Edit Configuration</legend>
              <Field as="textarea" name="value" cols={50} rows={10} />
            </fieldset>

            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Save
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
