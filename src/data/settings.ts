import { z } from 'zod';
import { getYObject } from './reads';
import * as Y from 'yjs';
import { updateData } from './writes';
import { useYjsData } from './hooks';

const Settings = z.object({
  name: z.string(),

  minContacts: z.number(),
  maxContacts: z.number(),
  minCloseContacts: z.number(),
  maxCloseContacts: z.number(),
});

export type Settings = z.infer<typeof Settings>;

export function getSettings(doc: Y.Doc): Settings | undefined {
  const map = doc.getMap('settings');
  if (!map.has('settings')) {
    return undefined;
  }
  return getYObject(doc.getMap('settings'), 'settings', Settings);
}

export function useSettings(doc: Y.Doc): Settings | undefined {
  return useYjsData(doc.getMap('settings'), Settings, 'settings', false);
}

export function resetSettings(doc: Y.Doc) {
  const map = doc.getMap('settings');
  updateData(
    map,
    'settings',
    {
      name: 'Nimetön peli',
      minContacts: 6,
      maxContacts: 15,
      minCloseContacts: 3,
      maxCloseContacts: 6,
    },
    Settings,
  );
}
