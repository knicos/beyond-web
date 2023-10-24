import { INode, IStream } from "../../api";
import { ICardDetails } from "../../components/StreamCard";

const path = process.env.ASSET_PATH;

export function buildCards(streams: IStream[], nodes: INode[]): ICardDetails[] {
  const cStream: ICardDetails[] = streams.reduce((r, s) => [...r, ...s.framesets.reduce((rr, fs) => [...rr, ...fs.frames.map(f => ({
    type: 'stream',
    title: f.title || fs.title || s.title || s.uri,
    image: `${path}v1/streams/thumbnail/${s.id}/${fs.framesetId}/${f.frameId}`,
    status: f.active ? 'active' : 'offline',
    link: `${path}view?s=${encodeURIComponent(s.uri)}&id=${s.id}&fsid=${fs.framesetId}&fid=${f.frameId}`,
    editable: true,
  }))], [])], []);

  const cNodes: ICardDetails[] = nodes.map((s) => ({
    type: 'node',
    title: s.name,
    status: s.active ? 'active' : 'offline',
    link: `${path}nodes/${s._id}`,
    editable: true,
  }));

  return [...cStream, ...cNodes];
}
