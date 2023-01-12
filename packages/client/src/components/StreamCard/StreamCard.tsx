import React from 'react';
import { StreamCardContainer, BackCard, StreamTitle, Overlays, StatusOverlay, InfoBar, Icon } from './styledComponents';
import {useNavigate} from 'react-router';
import {Link} from 'react-router-dom';
import { FaPen, FaVideo, FaServer } from 'react-icons/fa';

type CardType = 'frame' | 'frameset' | 'stream' | 'node';
type CardStatus = 'none' | 'offline' | 'active' | 'recorded';

export interface ICardDetails {
  type: CardType;
  title: string;
  status: CardStatus;
  image?: string;
  link: string;
  editable?: boolean;
}

function selectTypeIcon(type: string) {
  switch(type) {
    case 'stream': return <FaVideo />;
    case 'node': return <FaServer />;
    default: return <FaVideo />;
  }
}

const statusMap = {
  offline: 'Offline',
  active: 'Active',
  none: 'Unknown',
  recorded: 'Recorded',
};

function Status({ status }: { status: CardStatus }) {
  const text = statusMap[status] || status;
  return <StatusOverlay className={status}>{text}</StatusOverlay>;
}

export function StreamCard({ data }: { data: ICardDetails }) {
  const navigate = useNavigate();

  return (
    <StreamCardContainer onClick={() => {
      navigate(data.link);
    }}>
      <BackCard src={data.image} />
      <Overlays>
        <Status status={data.status} />
      </Overlays>
      <InfoBar>
        <Icon>
          {selectTypeIcon(data.type)}
        </Icon>
        <StreamTitle>{data.title}</StreamTitle>
        <Link to="">
          <FaPen />
        </Link>
      </InfoBar>
    </StreamCardContainer>
  );
}
