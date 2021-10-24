import React from 'react';
import {Table} from '../../components/Table';
import {FaCircle} from 'react-icons/fa';
import {useHistory} from 'react-router';
import {Card, CardTitle} from '../../components/SelectableCard/SelectableCard';
import {useRecoilValue} from 'recoil';
import {streamList} from '../../recoil/atoms';

export function Streams() {
  const streams = useRecoilValue(streamList);

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
      label: 'URI',
      fn: (data: any) => data.uri || '',
    }
  ];

  const path = process.env.ASSET_PATH;
  const history = useHistory();

  return (
    <Card>
      <CardTitle>Streams</CardTitle>
      <Table data={streams || []} columns={columns} onClick={(data) => {
        console.log('CLICK STREAM', data);
        history.push(`${path}streams/${data._id}`);
      }}/>
    </Card>
  )
}
