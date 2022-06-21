import React from 'react';
import {useRecoilValue} from 'recoil';
import {streamList, nodeList} from '../../recoil/atoms';
import {StreamCard} from '../../components/StreamCard';
import {Grid} from '../../components/SelectableCard/SelectableCard';
import { buildCards } from './buildCards';

export default function MainListing() {
  const streams = useRecoilValue(streamList);

  const cardData = buildCards(streams, []);
  
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