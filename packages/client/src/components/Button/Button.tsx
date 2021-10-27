import styled from 'styled-components';

export const Button = styled.button`
  
  background: ${props => props.theme.background.gray};
  appearance: none;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  color: white;
  font-family: 'Open Sans',Helvetica,Sans-Serif;
  cursor: pointer;

  &.primary {
    background: ${props => props.theme.background.purple};
    font-weight: bold;
  }

  &:disabled {
    background: ${props => props.theme.background.disabled}
  }
`;
