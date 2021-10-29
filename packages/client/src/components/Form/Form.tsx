import { Form as FormikForm } from 'formik';
import styled from 'styled-components';

export const Form = styled(FormikForm)`
  input[type=text], input[type=number], input[type=password] {
    border: 2px solid ${props => props.theme.border.green};
    border-radius: 5px;
    box-sizing: border-box;
    padding: 0.5rem;
    font-family: 'Open Sans',Helvetica,Sans-Serif;
    appearance: none;
    outline: none;

    &:focus {
      border: 2px solid ${props => props.theme.border.purple};
    }

    &:active {
      border: 2px solid ${props => props.theme.border.purple};
    }

    &:disabled {
      border: 2px solid ${props => props.theme.border.disabled};
    }
  }

  select {
    border: 2px solid ${props => props.theme.border.green};
    border-radius: 5px;
    box-sizing: border-box;
    padding: 0.5rem;
    font-family: 'Open Sans',Helvetica,Sans-Serif;
    outline: none;
    background: white;

    &:focus {
      border: 2px solid ${props => props.theme.border.purple};
    }

    &:active {
      border: 2px solid ${props => props.theme.border.purple};
    }

    &:disabled {
      border: 2px solid ${props => props.theme.border.disabled};
    }
  }

  fieldset {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    border: none;
    padding: 0;
    gap: 0.5rem;

    legend {
      font-weight: bold;
      margin-bottom: 0.8rem;
    }
  }

  button {
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
  }

  display: flex;
  flex-direction: column;
  padding: 1rem;
`;

export const ButtonBar = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
`;
