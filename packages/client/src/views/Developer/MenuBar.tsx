import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {IconButton} from '../../components/IconButton';
import {FaPlay, FaPause, FaSyncAlt, FaCircle} from 'react-icons/fa';
import { FTLStream } from '@ftl/stream';
import {startRecording, stopRecording} from '../../api/recorder';

const MenuContainer = styled.nav`
    display: flex;
    gap: 0.5rem;
`;

interface Props {
    stream: FTLStream;
}

export function MenuBar({stream}: Props) {
    const [paused, setPaused] = useState(false);
    const [recording, setRecording] = useState<string>(null);

    useEffect(() => {
        stream.paused = paused;
    }, [paused]);

    return <MenuContainer>
        <IconButton onClick={() => setPaused(!paused)}>
            {paused ? <FaPlay /> : <FaPause />}
        </IconButton>
        <IconButton onClick={() => stream.set(69, "reset")}>
            <FaSyncAlt />
        </IconButton>
        <IconButton onClick={async () => {
            if (recording) {
              stopRecording(recording);
              setRecording(null);
            } else {
              const res = await startRecording({streams: [stream.uri], channels: [0]});
              setRecording(res.id);
            }
          }}>
            <FaCircle color={recording ? 'red' : 'black'}/>
        </IconButton>
    </MenuContainer>;
}
