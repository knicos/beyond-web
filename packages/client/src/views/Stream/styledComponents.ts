import styled from 'styled-components';

export const Container = styled.div`
  background: white;
  width: 100%;
  max-width: 800px;
  padding: 2rem;
  margin: auto;
  box-sizing: border-box;
`;

export const SetContainer = styled.div`
  margin-top: 2rem;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  border: 2px solid ${props => props.theme.border.disabled};
  border-radius: 5px;
  padding: 1rem;

  legend {
    font-size: 0.9rem;
    font-weight: bold;
    margin: 0;
    margin-bottom: 1rem;
  }
`;
