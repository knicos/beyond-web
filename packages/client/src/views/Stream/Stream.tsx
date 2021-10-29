import React, { useState, useEffect } from 'react';
import { Formik, Field } from 'formik';
import { useParams } from 'react-router';
import { useHistory } from 'react-router-dom';
import { Form, ButtonBar } from '../../components/Form';
import { Container } from './styledComponents';
import { TableContainer } from '../Node/styledComponents';
import { getStream, saveStream, IStream } from '../../api/streams';
import { INode } from '../../api/nodes';
import { FaCircle, FaPen } from 'react-icons/fa';
import { getConfigs, IConfig, createConfig } from '../../api/configs';
import { Table } from '../../components/Table';
import {IconButton} from '../../components/IconButton';
import {ConfigDialog} from './ConfigDialog';
import {NewConfigDialog} from './NewConfigDialog';
import { TitleRow } from '../Streams/styledComponents';
import { useRecoilValue } from 'recoil';
import { nodeList } from '../../recoil/atoms';

function Frame({values, fsix, fix}: {values: any, fsix: number, fix: number}) {
  const nodes = useRecoilValue<INode[]>(nodeList) || [];
  const nodeId = values.framesets[fsix].frames[fix].nodeId;
  const node = nodeId ? nodes.find(n => n.serial === nodeId) : null;
  const devices = node ? node.devices : [];

  return <>
    <label htmlFor={`framesets.${fsix}.framesetId`}>Set ID</label>
    <Field type="text" name={`framesets.${fsix}.framesetId`} disabled={fix > 0}/>
    <label htmlFor={`framesets.${fsix}.title`}>Set Title</label>
    <Field type="text" name={`framesets.${fsix}.title`} disabled={fix > 0}/>
    <label htmlFor={`framesets.${fsix}.frames.${fix}.frameId`}>Frame ID</label>
    <Field type="text" name={`framesets.${fsix}.frames.${fix}.frameId`} />
    <label htmlFor={`framesets.${fsix}.frames.${fix}.title`}>Frame Title</label>
    <Field type="text" name={`framesets.${fsix}.frames.${fix}.title`} />
    <label htmlFor={`framesets.${fsix}.frames.${fix}.nodeId`}>Node</label>
    <Field as="select" name={`framesets.${fsix}.frames.${fix}.nodeId`}>
      <option key="default" value={'none'}>None</option>
      {nodes.map((n, ix) => <option key={ix} value={n.serial}>{n.name || n._id}</option>)}
    </Field>
    <label htmlFor={`framesets.${fsix}.frames.${fix}.deviceId`}>Device</label>
    <Field as="select" name={`framesets.${fsix}.frames.${fix}.deviceId`} disabled={devices.length === 0}>
      <option key={-1} value={undefined}>None</option>
      {devices.map((n, ix) => <option key={ix} value={n.serial}>{`${n.name} (${n.serial})`}</option>)}
    </Field>
    <label htmlFor={`framesets.${fsix}.frames.${fix}.autoStart`}>Auto-start</label>
    <Field type="checkbox" name={`framesets.${fsix}.frames.${fix}.autoStart`} />
  </>;
}

export function StreamView() {
  const { id, fsid, fid } = useParams<{ id: string, fsid: string, fid: string }>();
  const [stream, setStream] = useState<IStream>();
  const [config, setConfig] = useState<IConfig[]>([]);
  const [target, setTarget] = useState(null);
  const [showNewConfig, setShowNewConfig] = useState(false);
  const history = useHistory();
  
  useEffect(() => {
    getStream(id).then(setStream);
  }, [id]);

  const realFSID = stream?.framesets[parseInt(fsid, 10)].framesetId;
  const realFID = stream?.framesets[parseInt(fsid, 10)].frames[parseInt(fid, 10)].frameId;

  useEffect(() => {
    if (stream) {
      getConfigs({ uri: stream.uri, framesetId: realFSID, frameId: realFID, current: true }).then(setConfig);
    }
  }, [stream]);

  if (!stream) {
    return null;
  }

  const columns = [
    {
      label: 'Property',
      fn: (data: any) => data.channel || 'Unknown',
    },
    {
      label: 'Value',
      fn: (data: any) => data.value || '',
    },
    {
      label: '',
      fn: (data: any) => (
        <IconButton onClick={() => {
          setTarget({ title: '', value: data.value, channel: data.channel });
        }}><FaPen /></IconButton>
      ),
    }
  ];

  const configData = config.length === 1 ? Object.keys(config[0].data).map(k => ({
    channel: k,
    value: JSON.parse(config[0].data[k]),
  })) : [];

  return (
    <>
      <Formik
        initialValues={{
            title: stream?.title || 'No Title',
            uri: stream?.uri || 'No URI',
            framesets: stream?.framesets || [],
        }}
        enableReinitialize={true}
        onSubmit={async (values) => {
            await saveStream(id, {
              ...values,
            //  tags: values.tags.split(',').map(t => t.trim()),
            });
        }}
      >
        {({ isSubmitting, values }) => (
          <Container>
            <Form id="nodeform">
              <fieldset>
                <legend>Stream Details</legend>
                <label>Active</label>
                <FaCircle color={stream ? 'green' : 'red'} />
                <label htmlFor="title">Title</label>
                <Field type="text" name="title" disabled={true} />
                <label htmlFor="uri">URI</label>
                <Field type="text" name="uri" disabled={true} />
                <label htmlFor="tags">Tags</label>
                <Field type="text" name="tags" disabled={true} />
                <Frame values={values} fsix={parseInt(fsid, 10)} fix={parseInt(fid, 10)} />
              </fieldset>

              <TableContainer>
                <TitleRow>
                  <h1>Configuration</h1>
                  <IconButton onClick={() => setShowNewConfig(true)}>Add</IconButton>
                </TitleRow>
                <Table columns={columns} data={configData} />
              </TableContainer>

              <ButtonBar>
                <button type="submit" className="primary" disabled={isSubmitting}>
                  Save
                </button>
                <button>
                  Delete
                </button>
                <button onClick={() => history.goBack()}>
                  Cancel
                </button>
              </ButtonBar>
            </Form>
          </Container>
        )}
      </Formik>
      <ConfigDialog target={target} onClose={() => setTarget(null)} onSave={(d) => {
        config[0].data[d.channel] = JSON.stringify(d.value);
        console.log('SAVE CONFIG', config[0].data);
        createConfig({
          ...config[0],
          timestamp: undefined,
        })
        setTarget(null);
      }}/>
      <NewConfigDialog show={showNewConfig} onClose={() => setShowNewConfig(false)} onSave={(c) => {
        if (config.length === 0) {
          config.push({
            data: {},
            streamId: stream.uri,
            framesetId: realFSID,
            frameId: realFID,
            title: '',
            tags: [],
          });
        }
        config[0].data[c] = 'null';
        setShowNewConfig(false);
      }} />
    </>
  );
}
