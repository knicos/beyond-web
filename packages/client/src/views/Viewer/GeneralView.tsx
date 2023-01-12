import React from 'react';
import {SelectableCard, Grid} from '../../components/SelectableCard/SelectableCard';
import {useNavigate, useLocation} from 'react-router';
import styled from 'styled-components';
import {ReactPlayer} from '@ftl/player';
import {useRecoilValue, useSetRecoilState, useRecoilState} from 'recoil';
import {currentStream, frameTime, pageTitle, peer} from '../../recoil/atoms';
import {IStream} from '../../api/streams';

const FullWidthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: black;
  overflow: hidden;
`;

const VideoContainer = styled.div`
    background: black;
    height: 600px;
    aspect-ratio: 16 / 9;
`;

const TagButton = styled.button`
  outline: none;
  border: none;
  border-radius: 3px;
  background: ${props => props.theme.background.contrastBlue};
  padding: 0.5rem;
  color: white;
`;

export function GeneralView({ data }: { data: IStream }) {
    const path = process.env.ASSET_PATH;
    const navigate = useNavigate();
    const location = useLocation();
    const stream = useRecoilValue(currentStream);

    console.log('STREAM DATA', data);

    return (
      <>
        <FullWidthContainer>
          <VideoContainer style={{ height: `${Math.floor(window.innerHeight * 0.7)}px` }}>
              <ReactPlayer
                stream={stream}
                channel={0}
                size={800}
                movement={true}
                frameset={0}
                frame={0}
                image={data ? `${path}v1/streams/${data.id}/thumbnail` : null}
              />
          </VideoContainer>
        </FullWidthContainer>
        <Grid>
            <TagButton onClick={() => {
                navigate(`${path}view/skr${location.search}`)
            }}>
                SKR
            </TagButton>
            <TagButton onClick={() => {
                navigate(`${path}view/developer${location.search}`)
            }}>
                Developer
            </TagButton>
        </Grid>
      </>
    );
}
