import React from 'react';
import {Table} from '../../components/Table';
import {FaCircle} from 'react-icons/fa';
import {useNavigate} from 'react-router';
import {Card, CardTitle} from '../../components/SelectableCard/SelectableCard';
import {useRecoilValue} from 'recoil';
import {nodeList} from '../../recoil/atoms';

export function Nodes() {
  const nodes = useRecoilValue(nodeList);

  const columns = [
    {
      label: 'Active',
      fn: (data: any) => data.active ? <FaCircle color="green" /> : <FaCircle color="red" />,
    },
    {
      label: 'Name',
      fn: (data: any) => data.name || 'No Name',
    },
    {
      label: 'Location',
      fn: (data: any) => data.location || '',
    },
    {
      label: 'Latency',
      fn: (data: any) => data.latency || 'N/A',
    }
  ];

  const path = process.env.ASSET_PATH;
  const navigate = useNavigate();

  return (
    <Card>
      <CardTitle>Nodes</CardTitle>
      <Table data={nodes || []} columns={columns} onClick={(data) => {
        console.log('CLICK NODE', data);
        navigate(`${path}nodes/${data._id}`);
      }}/>
    </Card>
  )
}
