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
    tr {
      &.clickable {
        cursor: pointer;
      }
      padding: 0 0.5rem;

      .hidden {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: none;
        background: ${props => props.theme.background.lightGray};
      }

      &:hover {
        background: ${props => props.theme.background.lightGray};

        .hidden {
          display: flex;
        }
      }
    }
  }

  th {
    padding: 0.2rem 1rem;
  }

  td {
    padding: 0.5rem 1rem;
    position: relative;
  }

  th,td {
    border-bottom: 1px solid ${props => props.theme.border.lightGray};
    text-align: left;
  }
`;

interface IColumn {
  label: string;
  fn: (data: any, index: number) => React.ReactNode;
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
          <tr key={ix} className={onClick ? 'clickable' : ''} onClick={() => {
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
