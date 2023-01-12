import React, { useState, useEffect } from 'react';
import { Formik, Field } from 'formik';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import { Form, ButtonBar } from '../../components/Form';
import { Container, TableContainer } from './styledComponents';
import { getNode, saveNode, INode } from '../../api/nodes';
import { Table } from '../../components/Table';
import { FaCircle } from 'react-icons/fa';

const columns = [
  {
    label: 'Active',
    fn: (data: any) => data.active ? <FaCircle color="green" /> : <FaCircle color="red" />,
  },
  {
    label: 'Name',
    fn: (data: any) => data.name || 'No Name',
  },
];

const devColumns = [
  {
    label: 'Type',
    fn: (data: any) => data.type || 'Unknown',
  },
  {
    label: 'Name',
    fn: (data: any) => data.name || 'No Name',
  },
  {
    label: 'Serial',
    fn: (data: any) => data.serial || 'Unknown',
  },
];

export function Node() {
  const { id } = useParams<{ id: string }>();
  const [node, setNode] = useState<INode>();
  const navigate = useNavigate();
  
  useEffect(() => {
    getNode(id).then(setNode);
  }, [id]);

  console.log('NODE', node);

  if (!node) {
    return null;
  }

  return (
    <Formik
       initialValues={{
         name: node?.name || '',
         serial: node?.serial || '',
         date: node ? new Date(node.lastUpdate) : new Date(),
         latency: node?.latency ? `${node.latency}ms` : 'N/A',
         location: node?.location || '',
         active: node?.active || false,
         tags: node?.tags.join(', ') || '',
       }}
       enableReinitialize={true}
       onSubmit={async (values) => {
          await saveNode(id, {
            ...values,
            tags: values.tags.split(',').map(t => t.trim()),
          });
       }}
    >
      {({ isSubmitting }) => (
        <Container>
          <Form id="nodeform">
            <fieldset>
              <legend>Node Details</legend>
              <label>Active</label>
              <FaCircle color={node?.active ? 'green' : 'red'} />
              <label htmlFor="name">Name</label>
              <Field type="text" name="name" />
              <label htmlFor="location">Location</label>
              <Field type="text" name="location" />
              <label htmlFor="serial">Serial</label>
              <Field type="text" name="serial" disabled={true} />
              <label htmlFor="date">Last Update</label>
              <Field type="text" name="date" disabled={true} />
              <label htmlFor="latency">Latency</label>
              <Field type="text" name="latency" disabled={true} />
              <label htmlFor="tags">Tags</label>
              <Field type="text" name="tags" />
            </fieldset>

            <TableContainer>
              <h1>Streams</h1>
              <Table columns={columns} data={node?.streams || []} />
            </TableContainer>

            <TableContainer>
              <h1>Devices</h1>
              <Table columns={devColumns} data={node?.devices || []} />
            </TableContainer>

            <ButtonBar>
              <button type="submit" className="primary" disabled={isSubmitting}>
                Save
              </button>
              <button>
                Delete
              </button>
              <button onClick={() => navigate(-1)}>
                Cancel
              </button>
            </ButtonBar>
          </Form>
        </Container>
      )}
    </Formik>
  );
}
