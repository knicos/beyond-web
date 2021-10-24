import React from 'react';
import {useRecoilValue} from 'recoil';
import {streamList, nodeList} from '../../recoil/atoms';
import {StreamCard} from '../../components/StreamCard';
import {Grid} from '../../components/SelectableCard/SelectableCard';
import { buildCards } from './buildCards';

export default function MainListing() {
  const streams = useRecoilValue(streamList);
  const nodes = useRecoilValue(nodeList);

  const cardData = buildCards(streams, nodes);
  
  return (
    <>
      <Grid>
        {cardData.map((c, ix) => {
          return <StreamCard key={ix} data={c} />
        })}
      </Grid>
    </>
  )
}