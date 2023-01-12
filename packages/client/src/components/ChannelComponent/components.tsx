import React, {useState, useEffect} from 'react';
import styled from 'styled-components';
import pupa from 'pupa';
import Plotly from 'plotly.js-dist-min';
import {useRecoilState} from 'recoil';
import {pinnedData} from '../../recoil/atoms';
import {FaMapPin} from 'react-icons/fa';
import {SketchPicker} from 'react-color';

const Name = styled.div`
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    background: #e5e5e5;
    border-radius: 5px;
    display: flex;
    justify-content: space-between;
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

const Pin = styled(FaMapPin)`
    color: silver;
    &.pinned {
        color: gold;
    }
    cursor: pointer;
`;

interface IManifestOption {
    label: string;
    value: string;
}

interface IManifest {
    title: string;
    component: string;
    type: string;
    enum?: string[];
    labels?: string[];
}

interface DataItemProps {
    name: string;
    value: string | number | boolean | React.ReactNode;
    channel?: number;
}

export function DataItem({name, value, channel}: DataItemProps) {
    const [pinned, setPinned] = useRecoilState<Set<number>>(pinnedData);
    const type = typeof value;

    const element = type === 'object' ? value : `${value}`;

    return <>
        <Name>
            {name}
            {channel !== undefined && <Pin className={pinned.has(channel) ? 'pinned' : ''} onClick={() => {
                if (channel) {
                    if (pinned.has(channel)) {
                        pinned.delete(channel);
                    } else {
                        pinned.add(channel);
                    }
                    setPinned(pinned);
                }
            }}/>}
        </Name>
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
    return <DataItem name={config.title} value={<img width="50" src={img} />} />
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
    const str = typeof data === 'object' ? JSON.stringify(data) : data as string;
    return <DataItem channel={channel} name={pupa(config.title, {channel})} value={str} />;
}

function TemporalHistogram({data, config, channel}: IDataComponentProps) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        Plotly.react(`plotly${channel}`, [{z: history, type: 'heatmap'}], {margin: {t: 40, l: 30, r: 30, b: 40}});
    }, [history]);

    useEffect(() => {
        if (Array.isArray(data)) {
            setHistory(old => [...old, data].slice(Math.max(0, old.length - 20)));
        }
    }, [data]);

    return <DataItem channel={channel} name={pupa(config.title, {channel})} value={<div id={`plotly${channel}`}></div>} />;
}

function Histogram({data, config, channel}: IDataComponentProps) {
    useEffect(() => {
        if (Array.isArray(data)) {
            Plotly.react(`plotly${channel}`, [{y: data, type: 'bar'}], {margin: {t: 40, l: 30, r: 30, b: 40}});
        }
    }, [data]);

    return <DataItem channel={channel} name={pupa(config.title, {channel})} value={<div id={`plotly${channel}`}></div>} />;
}

function EditableValue({data, config, channel, onChange}: IDataComponentProps) {
    const [value, setValue] = useState(JSON.stringify(data));

    useEffect(() => {
        setValue(JSON.stringify(data));
    }, [data]);

    let input: JSX.Element = null;

    if (config.type === 'number') {
      input = <input type="number" value={value} onChange={e=> setValue(e.target.value)} onBlur={e => {
        // setValue(e.target.value);
        try {
            const newValue = JSON.parse(e.target.value);
            onChange(channel, newValue);
        } catch (e) {

        }
      }} />;
    } else if (config.type === 'boolean') {
      input = <input type="checkbox" checked={value === 'true'} onChange={e => {
        setValue(e.target.checked ? 'true' : 'false');
        try {
            const newValue = e.target.checked;
            onChange(channel, newValue);
        } catch (e) {

        }
      }} />;
    } else {
      input = <input type="text" value={value} onChange={e=> setValue(e.target.value)} onBlur={e => {
          // setValue(e.target.value);
          try {
              const newValue = JSON.parse(e.target.value);
              onChange(channel, newValue);
          } catch (e) {

          }
      }} />;
    }
    return <DataItem channel={channel} name={pupa(config.title, {channel})} value={input} />;
}

function Enumerated({data, config, channel, onChange}: IDataComponentProps) {
    if (typeof data !== 'string' && typeof data !== 'number') {
        return null;
    }
    const input = <select value={data} onChange={e => onChange && onChange(channel, config.type === 'number' ? parseInt(e.target.value) : e.target.value)}>
        {config.enum.map((option, key) => <option key={key} value={option}>{config.labels?.[key] || option}</option>)}
    </select>;
    return <DataItem channel={channel} name={pupa(config.title, {channel})} value={input} />;
}

function ColourPicker({data, config, channel, onChange}: IDataComponentProps) {
  const [value, setValue] = useState<string>(`${data}`);

  const input = <SketchPicker color={value} onChangeComplete={(color: any) => {
    setValue(color.hex);
    onChange(channel, color.hex);
  }}/>
  return <DataItem channel={channel} name={pupa(config.title, {channel})} value={input} />;
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
    Histogram,
    TemporalHistogram,
    ColourPicker,
};
