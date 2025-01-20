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
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";
import { TextEditor } from "./editor";

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
              {characterGroups.get(char.id)?.map(group => <Badge key={group.id}>{group.id}</Badge>)}
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
  const [name, setName] = useYjsValue(character ?? {name: ''}, 'name');
  const [workName, setWorkName] = useYjsValue(character ?? {workName: ''}, 'workName');

  const [ownTags, availableTags] = useTags(doc, character?.id ?? '');
  const ownGroups = ownTags.filter(tag => tag.type == 'group');
  const availableGroups = availableTags
    .filter(tag => tag.type == 'group')
    .filter(tag => tag.characters.size > 0); // Suggest only non-empty groups
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  if (!character) {
    return null; // Loading...
  }

  return <div>
    <h1 className="text-4xl p-2">
      <input placeholder="Hahmon nimi" value={name} onChange={(event) => setName(event.target.value)} className="outline-none max-w-md" />
    </h1>
    <div className="flex flex-col gap-2">
      <FieldGroup>
        <DataField id="workname" label="Työnimi" grow>
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
      </FieldGroup>
      <FieldGroup>
        <DataField id="description" label="Pelinjohdon kuvaus" grow>
          <TextEditor fragment={character.details} />
        </DataField>
      </FieldGroup>
    </div>
    <ContactList chId={character.id} />
  </div>;
};

const DataField = ({ id, label, children, grow }: { id: string; label: string; children: ReactNode; grow?: boolean }) => {
  return <div className={cn('flex flex-col space-x-2 mb-2', grow && 'flex-grow')}>
    <Label htmlFor={id} className="ml-3 mb-1">{label}</Label>
    {children}
  </div>
}

const FieldGroup = ({ children }: { children: ReactNode }) => {
  return <div className="flex gap-4">
    {children}
  </div>
}

export const CharacterName = ({character}: {character: Character}) => {
  if (character.name.length == 0) {
    return <>{character.workName}</>
  }
  return <>{character.name} ({character.workName})</>;
}