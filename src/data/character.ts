import { TypeOf, z } from 'zod';
import { useYjsData, useYjsQuery } from './hooks';
import * as Y from 'yjs';
import { updateData } from './writes';
import { PositionSource } from 'position-strings';
import { queryYjs } from './reads';

const Character = z.object({
  id: z.string(),
  sortKey: z.string(),

  name: z.string(),
  workName: z.string(),
  blurb: z.string(),
  details: z.instanceof(Y.XmlFragment),
  playerDescLink: z.string(),

  detailsReady: z.boolean(),
  contactsReady: z.boolean(),
});

export type Character = TypeOf<typeof Character>;

export function useCharacters(doc: Y.Doc): Character[] {
  return useYjsQuery(doc.getMap('characters'), Character, [{}], true);
}

export function useCharacter(doc: Y.Doc, id: string, deep: boolean): Character | undefined {
  return useYjsData(doc.getMap('characters'), Character, id, deep);
}

const posSource = new PositionSource();

export function createCharacter(doc: Y.Doc, id: string): void {
  console.log('Creating character', id);
  const lastCh = queryYjs(doc.getMap('characters'), Character, [{}])
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey)).at(-1);

  updateData(doc.getMap('characters'), id, {
    id,
    sortKey: posSource.createBetween(lastCh?.sortKey),
    name: '',
    workName: 'Uusi hahmo',
    blurb: '',
    details: new Y.XmlFragment(),
    playerDescLink: '',
    detailsReady: false,
    contactsReady: false,
  }, Character);
}