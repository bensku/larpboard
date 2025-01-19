import { ReactNode, useContext, useState } from "react";
import { Label } from "./components/ui/label";
import { Character, createCharacter, useCharacter, useCharacters } from "./data/character";
import { useYjsValue } from "./data/hooks";
import { Input } from "./components/ui/input";
import { TagInput } from "emblor";
import { addTag, removeTag, Tag, useAllTags, useTags } from "./data/tag";
import { PROJECT } from "./data";
import { ContactList } from "./contacts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { navigate } from "wouter/use-browser-location";
import { Badge } from "lucide-react";
import { Button } from "./components/ui/button";

export const CharacterList = () => {
  const doc = useContext(PROJECT);
  const characters = useCharacters(doc);

  // Figure out what tags we have and which characters they belong to
  // For now, only do this for groups - might have other tags later
  const characterGroups: Map<string, Tag[]> = new Map();
  const allTags = useAllTags(doc);
  const groups = allTags.filter(tag => tag.type == 'group');
  for (const group of groups) {
    for (const member of group.characters.keys()) {
      let memberGroups = characterGroups.get(member);
      if (!memberGroups) {
        memberGroups = [];
        characterGroups.set(member, memberGroups);
      }
      memberGroups.push(group);
    }
  }

  const newCharacter = () => {
    const id = crypto.randomUUID();
    createCharacter(doc, id);
    navigate(`/characters/${id}`)
  }

  return <div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nimi</TableHead>
          <TableHead>Työnimi</TableHead>
          <TableHead>Ryhmät</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {characters.map((char) =>
          <TableRow key={char.id} onClick={() => navigate(`/characters/${char.id}`)} className="cursor-grab">
            <TableCell>{char.name}</TableCell>
            <TableCell>{char.workName}</TableCell>
            <TableCell className="flex gap-2">
              {characterGroups.get(char.id)?.map(group => <Badge>{group.id}</Badge>)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    <div>
      Yhteensä {characters.length} hahmoa.
    </div>
    <Button variant="outline" onClick={newCharacter}>Luo hahmo...</Button>
  </div>;
};

export const CharacterView = ({ id }: { id: string }) => {
  const doc = useContext(PROJECT);
  const character = useCharacter(doc, id, true);
  const [name, setName] = useYjsValue(character, 'name');
  const [workName, setWorkName] = useYjsValue(character, 'workName');

  const [ownTags, availableTags] = useTags(doc, character.id);
  const ownGroups = ownTags.filter(tag => tag.type == 'group');
  const availableGroups = availableTags
    .filter(tag => tag.type == 'group')
    .filter(tag => tag.characters.size > 0); // Suggest only non-empty groups
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  return <div>
    <h1 className="text-4xl p-2">
      <input placeholder="Hahmon nimi" value={name} onChange={(event) => setName(event.target.value)} className="outline-none max-w-md" />
    </h1>
    <div className="flex flex-col gap-2 max-w-md">
      <DataField id="workname" label="Työnimi">
        <Input name="workname" value={workName} onChange={(event) => setWorkName(event.target.value)} />
      </DataField>
      <DataField id="groups" label="Ryhmät">
        <TagInput name="groups" tags={ownGroups.map(tag => ({ id: tag.id, text: tag.id }))} setTags={() => null}
          enableAutocomplete={true}
          autocompleteOptions={availableGroups.map(tag => ({ id: tag.id, text: tag.id }))}
          onTagAdd={(tag) => addTag(doc, character.id, { id: tag, type: 'group' })}
          onTagRemove={(tag) => removeTag(doc, character.id, tag)}
          activeTagIndex={activeGroup} setActiveTagIndex={setActiveGroup} />
      </DataField>
    </div>
    <ContactList chId={character.id} />
  </div>;
};

const DataField = ({ id, label, children }: { id: string; label: string; children: ReactNode; }) => {
  return <div className="flex items-center space-x-2">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
}