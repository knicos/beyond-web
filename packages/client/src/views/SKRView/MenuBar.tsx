import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {IconButton} from '../../components/IconButton';
import {FaPlay, FaPause, FaSyncAlt, FaSave, FaUndoAlt} from 'react-icons/fa';
import { FTLStream } from '@ftl/stream';

const MenuContainer = styled.nav`
    display: flex;
    gap: 0.5rem;
`;

interface Props {
    stream: FTLStream;
}

export function MenuBar({stream}: Props) {
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        stream.paused = paused;
    }, [paused]);

    return <MenuContainer>
        <IconButton onClick={() => setPaused(!paused)}>
            {paused ? <FaPlay /> : <FaPause />}
        </IconButton>
        <IconButton onClick={() => stream.set(69, ["reset"])}>
            <FaSyncAlt />
        </IconButton>
        <IconButton onClick={() => stream.set(69, ["save_data"])}>
            <FaSave />
        </IconButton>
        <IconButton onClick={() => stream.set(69, ["restore_data"])}>
            <FaUndoAlt />
        </IconButton>
    </MenuContainer>;
}
