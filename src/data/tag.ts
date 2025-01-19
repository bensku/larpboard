import { TypeOf, z } from "zod";
import * as Y from "yjs";
import { useYjsQuery } from "./hooks";
import { updateData } from "./writes";

const Tag = z.object({
  id: z.string(),
  type: z.string(),
  characters: z.instanceof(Y.Map),
});

export type Tag = TypeOf<typeof Tag>;

export function useAllTags(doc: Y.Doc): Tag[] {
  return useYjsQuery(doc.getMap('tags'), Tag, [{}], true);
}

export function useTags(doc: Y.Doc, chId: string): [Tag[], Tag[]]{
  const allTags = useYjsQuery(doc.getMap('tags'), Tag, [{}], true);
  const current: Tag[] = [], available: Tag[] = [];
  for (const tag of allTags) {
    if (tag.characters.has(chId)) {
      current.push(tag);
    } else {
      available.push(tag);
    }
  }
  return [current, available];
}

export function addTag(doc: Y.Doc, chId: string, tag: Omit<Tag, 'characters'>) {
  // Update tag data or create it
  updateData(doc.getMap('tags'), tag.id, {
    ...tag,
  }, Tag);

  // Add member list to it unless it already exists
  const map = doc.getMap('tags').get(chId) as Y.Map<Y.Map<unknown>>;
  if (!map.has('characters')) {
    map.set('characters', new Y.Map());
  }
  map.get('characters')?.set(chId, true); // Add character as member
}

export function removeTag(doc: Y.Doc, chId: string, tagId: string) {
  const map = doc.getMap('tags').get(chId) as Y.Map<Y.Map<unknown>>;
  if (map) {
    const chars = map.get('characters') as Y.Map<string>;
    if (chars) {
      chars.delete(tagId);
      // TODO delete if empty? race condition risk?
    }
  }
}