import React from 'react';
import styled from 'styled-components';

const StyledTable = styled.table`
  padding: 0;
  border-spacing: 0;
  font-size: 0.9rem;

  thead {
    color: ${props => props.theme.text.dark};
    font-weight: bold;
  }

  tbody {
    background: white;
  }

  th,td {
    padding: 0.2rem 1rem;
    border-bottom: 1px solid ${props => props.theme.border.purple};
    text-align: left;
  }
`;

interface IColumn {
  label: string;
  fn: (data: any, index: number) => unknown;
}

interface Props {
  columns: IColumn[];
  data: any[];
  onClick?: (data: any, ix: number) => void;
}


export function Table({data, columns, onClick}: Props) {
  return (
    <StyledTable>
      <thead>
        <tr>
          {columns.map((c, ix) => <th key={ix}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((d, ix) => (
          <tr key={ix} onClick={() => {
            if (onClick) {
              onClick(d, ix);
            }
          }}>
            {columns.map((c, ix2) => (
              <td key={ix2}>{c.fn(d, ix)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </StyledTable>
  )
}
