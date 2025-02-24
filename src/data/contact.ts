import { z, TypeOf } from 'zod';
import * as Y from 'yjs';
import { useYjsQuery } from './hooks';
import { deleteData, updateData } from './writes';
import { PositionSource } from 'position-strings';
import { queryYjs } from './reads';

const Contact = z.object({
  aId: z.string(),
  aDesc: z.instanceof(Y.XmlFragment),
  aSortKey: z.string(),

  bId: z.string(),
  bDesc: z.instanceof(Y.XmlFragment),
  bSortKey: z.string(),

  close: z.boolean(),
  oneSided: z.boolean(),
});

export type Contact = TypeOf<typeof Contact>;

export function useContacts(doc: Y.Doc, chId: string): Contact[] {
  // TODO deep watch needed to get drag-sorting working - change if performance degrades
  return useYjsQuery(
    doc.getMap('contacts'),
    Contact,
    [{ aId: chId }, { bId: chId }],
    true,
    (path) => !path.includes('aDesc') && !path.includes('bDesc'),
  );
}

export function getContacts(doc: Y.Doc, chId: string): Contact[] {
  return queryYjs(doc.getMap('contacts'), Contact, [
    { aId: chId },
    { bId: chId },
  ]);
}

export const posSource = new PositionSource();

export function createContact(doc: Y.Doc, fromId: string, toId: string) {
  let aId: string, bId: string;
  if (toId > fromId) {
    aId = fromId;
    bId = toId;
  } else {
    aId = toId;
    bId = fromId;
  }

  // Figure out the last contacts on both sides to place this after them
  const aLast = sortContacts(
    aId,
    queryYjs(doc.getMap('contacts'), Contact, [{ aId: aId }, { bId: aId }]),
  ).at(-1);
  const bLast = sortContacts(
    bId,
    queryYjs(doc.getMap('contacts'), Contact, [{ aId: bId }, { bId: bId }]),
  ).at(-1);

  // Push the new, empty contact
  updateData(
    doc.getMap('contacts'),
    `${aId}-${bId}`,
    {
      aId,
      aDesc: new Y.XmlFragment(),
      aSortKey: posSource.createBetween(
        aLast?.aId == aId ? aLast.aSortKey : aLast?.bSortKey,
      ),
      bId,
      bDesc: new Y.XmlFragment(),
      bSortKey: posSource.createBetween(
        bLast?.aId == bId ? bLast.aSortKey : bLast?.bSortKey,
      ),

      close: false,
      oneSided: false,
    },
    Contact,
  );
}

export function sortContacts(chId: string, contacts: Contact[]) {
  return contacts.sort((lhs, rhs) => {
    const aKey = chId == lhs.aId ? lhs.aSortKey : lhs.bSortKey;
    const bKey = chId == rhs.aId ? rhs.aSortKey : rhs.bSortKey;
    return aKey.localeCompare(bKey);
  });
}

export function deleteContact(doc: Y.Doc, contact: Contact) {
  deleteData(doc.getMap('contacts'), `${contact.aId}-${contact.bId}`);
}

export function updateContact(
  doc: Y.Doc,
  id: string,
  contact: Partial<Contact>,
) {
  updateData(doc.getMap('contacts'), id, contact, Contact);
}
