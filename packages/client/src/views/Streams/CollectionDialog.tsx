import React from 'react';
import { createStream, IStream } from '../../api/streams';
import { Form, ButtonBar } from '../../components/Form';
import { Formik, Field } from 'formik';
import {Dialog} from '../../components/Dialog';

interface Props {
  show: boolean;
  onClose: () => void;
}

export function CollectionDialog({show, onClose}: Props) {
  return (
    <Dialog show={show}>
      <Formik
        initialValues={{
            title: '',
        }}
        enableReinitialize={true}
        onSubmit={async (values) => {
            // Create
            await createStream(values);
            onClose();
        }}
      >
        {({ isSubmitting }) => (
          <Form id="collectionform">
            <fieldset>
              <legend>New Collection</legend>
              <label htmlFor="title">Title</label>
              <Field type="text" name="title" />
            </fieldset>

            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Create
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
