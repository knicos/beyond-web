import styled from 'styled-components';

export const BackCard = styled.img`
  width: 340px;
  aspect-ratio: 16 / 9;
`;

export const Overlays = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 340px;
  aspect-ratio: 16 / 9;
  cursor: pointer;
`;

export const StatusOverlay = styled.div`
  position: absolute;
  right: 0.7rem;
  bottom: 0.5rem;
  border-radius: 3px;
  background: #555;
  padding: 0.1rem 0.3rem;
  color: white;
  font-size: 0.8rem;

  &.offline {
    background: #555;
  }

  &.active {
    background: ${props => props.theme.background.contrastGreen};
  }
`;

export const InfoBar = styled.div`
  margin: 1rem;
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
  align-items: center;
`;

export const StreamTitle = styled.div`
  text-shadow: 0 0 3px #ccc;
  color: black;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
`;

export const Icon = styled.div`
  border-radius: 50%;
  background: ${props => props.theme.background.purple};
  color: white;
  padding: 0.5rem;
  width: 1em;
  height: 1em;
  line-height: 1em;
`;

export const StreamCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 5px;
  overflow: hidden;
  position: relative;
`;
