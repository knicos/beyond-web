import React from 'react';
import styled from 'styled-components';
import {IconButton} from '../../components/IconButton';
import {FaPlay, FaPause} from 'react-icons/fa';
import { FTLStream } from '@ftl/stream';

const MenuContainer = styled.nav`
    display: flex;
`;

interface Props {
    stream: FTLStream;
}

export function MenuBar({stream}: Props) {
    return <MenuContainer>
        <IconButton onClick={() => {
            stream.paused = true;
        }}><FaPause /></IconButton>
    </MenuContainer>;
}
