import React, {useState, useEffect} from 'react';
import styled from 'styled-components';

const Name = styled.div`
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    background: #efefef;
`;

const Value = styled.div`
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    background: white;

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

interface IManifest {
    label: string;
    component: string;
}

function DataItem({name, value}: {name: string, value: string | number | boolean | React.ReactNode}) {
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

function RawValue({data, config}: {data: unknown, config: IManifest}) {
    const str = typeof data === 'object' ? JSON.stringify(data) : data;
    return <DataItem name={config.label} value={str} />;
}

export const components: Record<string, React.FunctionComponent<{data: unknown, config?: IManifest}>> = {
    Calibration,
    Metadata,
    Image,
    Capabilities,
    RawValue,
};
