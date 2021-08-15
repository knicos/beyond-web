import React, {useState, useEffect} from 'react';
import styled from 'styled-components';
import pupa from 'pupa';

const Name = styled.div`
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    background: #e5e5e5;
    border-radius: 3px;
`;

const Value = styled.div`
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    background: #f4f4f4;
    border-radius: 3px;

    &.number {
        color: blue;
    }

    &.boolean {
        color: green;
    }

    &.string {
        color: red;
    }
`;

interface IManifestOption {
    label: string;
    value: string;
}

interface IManifest {
    label: string;
    component: string;
    options?: IManifestOption[];
}

export function DataItem({name, value}: {name: string, value: string | number | boolean | React.ReactNode}) {
    const type = typeof value;

    const element = type === 'object' ? value : `${value}`;

    return <>
        <Name>{name}</Name>
        <Value className={type} >{element}</Value>
    </>
}

function Calibration({data}: {data: number[][]}) {
    return <>
        <DataItem name="Focal" value={data[0][0]} />
        <DataItem name="Width" value={data[0][4]} />
        <DataItem name="Height" value={data[0][5]} />
    </>;
}

function Image({data, config}: {data: any, config: IManifest}) {
    const [img, setImg] = useState(null);
    useEffect(() => {
        setImg(URL.createObjectURL(
            new Blob([data])
        ));
    }, [data])
    return <DataItem name={config.label} value={<img width="50" src={img} />} />
}

interface IMetaData {
    device: string;
    name: string;
    uri: string;
}

function Metadata({data}: {data: IMetaData}) {
    return <>
        <DataItem name="Device" value={data.device} />
        <DataItem name="Name" value={data.name} />
        <DataItem name="URI" value={data.uri} />
    </>;
}

const CAPABILITIES = [
    "Movable",
    "Active",
    "Video",
    "Adjustable",
    "Virtual",
    "Touch",
    "VR",
    "Live",
    "Fused",
    "Streamed",
    "Equi-rectangular",
    "Stereo",
];

function Capabilities({data}: {data: number[]}) {
    return <>
        {data.map((d, ix) => <DataItem key={ix} name={CAPABILITIES[d]} value={true} />)}
    </>;
}

function RawValue({data, config, channel}: IDataComponentProps) {
    const str = typeof data === 'object' ? JSON.stringify(data) : data;
    return <DataItem name={pupa(config.label, {channel})} value={str} />;
}

function EditableValue({data, config, channel, onChange}: IDataComponentProps) {
    const [value, setValue] = useState(JSON.stringify(data));

    useEffect(() => {
        setValue(JSON.stringify(data));
    }, [data]);

    const input = <input type="text" value={value} onChange={e=> setValue(e.target.value)} onBlur={e => {
        // setValue(e.target.value);
        try {
            const newValue = JSON.parse(e.target.value);
            onChange(channel, newValue);
        } catch (e) {

        }
    }} />;
    return <DataItem name={pupa(config.label, {channel})} value={input} />;
}

function Enumerated({data, config, channel, onChange}: IDataComponentProps) {
    if (typeof data !== 'string') {
        return null;
    }
    const input = <select value={data} onChange={e => onChange && onChange(channel, e.target.value)}>
        {config.options.map((option, key) => <option key={key} value={option.value}>{option.label}</option>)}
    </select>;
    return <DataItem name={pupa(config.label, {channel})} value={input} />;
}

interface IDataComponentProps {
    data: unknown;
    config?: IManifest;
    channel?: number;
    onChange?: (channel: number, value: unknown) => void;
}

export const components: Record<string, React.FunctionComponent<IDataComponentProps>> = {
    Calibration,
    Metadata,
    Image,
    Capabilities,
    RawValue,
    Enumerated,
    EditableValue,
};
