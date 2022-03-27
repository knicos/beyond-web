import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import {IconButton} from '../../components/IconButton';
import {FaPlay, FaPause, FaSyncAlt, FaCircle} from 'react-icons/fa';
import { FTLStream } from '@ftl/stream';
import {startRecording, stopRecording, ICreateRecording} from '../../api/recorder';
import {RecordDialog} from './RecordDialog';

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
    const [showRecording, setShowRecording] = useState(false);

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
              setShowRecording(true);
            }
          }}>
            <FaCircle color={recording ? 'red' : 'black'}/>
        </IconButton>
        <RecordDialog show={showRecording} stream={stream} onClose={() => setShowRecording(false)} onRecord={async (data: ICreateRecording) => {
            const res = await startRecording(data);
            setRecording(res.id);
            setShowRecording(false);
        }} />
    </MenuContainer>;
}
