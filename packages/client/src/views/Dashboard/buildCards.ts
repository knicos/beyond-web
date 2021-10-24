import { INode, IStream } from "../../api";
import { ICardDetails } from "../../components/StreamCard";

const path = process.env.ASSET_PATH;

export function buildCards(streams: IStream[], nodes: INode[]): ICardDetails[] {
  const cStream: ICardDetails[] = streams.map((s) => ({
    type: 'stream',
    title: s.title || s.uri,
    image: `${path}v1/streams/${s.id}/thumbnail`,
    status: 'offline',
    link: `${path}view?s=${encodeURIComponent(s.uri)}&id=${s.id}`,
    editable: true,
  }));

  const cNodes: ICardDetails[] = nodes.map((s) => ({
    type: 'node',
    title: s.name,
    status: s.active ? 'active' : 'offline',
    link: `${path}nodes/${s._id}`,
    editable: true,
  }));

  return [...cStream, ...cNodes];
}
