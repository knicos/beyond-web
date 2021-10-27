import React from 'react';
import { saveStream, IStream } from '../../api/streams';
import { Form, ButtonBar } from '../../components/Form';
import { Formik, Field } from 'formik';
import {Dialog} from '../../components/Dialog';

interface Props {
  show: boolean;
  onClose: () => void;
  collections: IStream[];
}

export function StreamDialog({show, onClose, collections}: Props) {
  const collectionOptions = collections.map((c, ix) => (
    <option key={ix} value={c.id}>{c.title || c.uri}</option>
  ));
  return (
    <Dialog show={show}>
      <Formik
        initialValues={{
            collection: '',
            title: '',
            frameset: 0,
            frame: 0,
        }}
        enableReinitialize={true}
        onSubmit={async (values) => {
            // Create
            //await createStream(values);
            const collection = collections.find(c => c.id === values.collection);
            if (!collection) {
              console.error('Bad collection', values.collection);
              return;
            }
            const framesets = [...collection.framesets];
            console.log('CREATE STREAM', values, collection);
            const frameset = framesets.find(f => f.framesetId === values.frameset);
            if (!frameset) {
              framesets.push({
                framesetId: values.frameset,
                frames: [
                  {
                    frameId: values.frame,
                    title: values.title,
                  }
                ],
              });
            } else {
              if (!frameset.frames) {
                frameset.frames = [];
              }
              if (frameset.frames?.some(f => f.frameId === values.frame)) {
                console.error('Frame already exists');
                onClose();
                return;
              } else {
                frameset.frames.push({
                  title: values.title,
                  frameId: values.frame,
                });
              }
            }
            await saveStream(values.collection, { framesets });
            onClose();
        }}
      >
        {({ isSubmitting }) => (
          <Form id="collectionform">
            <fieldset>
              <legend>New Stream</legend>
              <label htmlFor="collection">Collection</label>
              <Field as="select" name="collection">
                {collectionOptions}
              </Field>
              <label htmlFor="frameset">Set</label>
              <Field type="number" name="frameset" />
              <label htmlFor="frame">Frame</label>
              <Field type="number" name="frame" />
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
