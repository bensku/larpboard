import { useContext, useState } from "react";
import { Character, createCharacter, deleteCharacter, useCharacter, useCharacters } from "./data/character";
import { useYjsValue } from "./data/hooks";
import { TagInput } from "emblor";
import { addTag, removeTag, Tag, useAllTags, useTags } from "./data/tag";
import { PROJECT } from "./data";
import { ContactList } from "./contacts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { navigate } from "wouter/use-browser-location";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { TextEditor } from "./editor";
import { Field, FieldGroup, TextField, Toggle } from "./components/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { validate } from "./validators/core";
import { validateContactCount, validateGroupContacts, validateOneSidedContacts } from "./validators/contact";
import { Alert } from "./components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "./components/ui/alert-dialog";

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

  if (!character) {
    return null; // Loading...
  }

  return <div>
    <h1 className="text-4xl p-2">
      <input placeholder="Hahmon nimi" value={name} onChange={(event) => setName(event.target.value)} className="outline-none max-w-md" />
    </h1>
    <Tabs defaultValue="details">
      <TabsList>
        <TabsTrigger value="details">Tiedot</TabsTrigger>
        <TabsTrigger value="contacts">Kontaktit</TabsTrigger>
        <TabsTrigger value="settings">Asetukset</TabsTrigger>
      </TabsList>
      <TabsContent value="details">
        <DetailsView character={character} />
      </TabsContent>
      <TabsContent value="contacts">
        <ContactsView character={character} />
      </TabsContent>
      <TabsContent value="settings">
        <SettingsView character={character} />
      </TabsContent>
    </Tabs>
  </div>;
};

const DetailsView = ({ character }: { character: Character }) => {
  const doc = useContext(PROJECT);
  const [ownTags, availableTags] = useTags(doc, character?.id ?? '');
  const ownGroups = ownTags.filter(tag => tag.type == 'group');
  const availableGroups = availableTags
    .filter(tag => tag.type == 'group')
    .filter(tag => tag.characters.size > 0); // Suggest only non-empty groups
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  return <div className="flex flex-col gap-2">
    <FieldGroup>
      <TextField obj={character} field="workName" label="Työnimi" grow />
      <TextField obj={character} field="writerName" label="Kirjoittaja" />
    </FieldGroup>
    <FieldGroup>
      <TextField obj={character} field="blurb" label="Hahmo hyvin lyhyesti" grow />
      <TextField obj={character} field="playerDescLink" label="Linkki hahmokuvaukseen" grow />
    </FieldGroup>
    <FieldGroup>
      <Field id="groups" label="Ryhmät">
        <TagInput name="groups" tags={ownGroups.map(tag => ({ id: tag.id, text: tag.id }))} setTags={() => null}
          enableAutocomplete={true}
          autocompleteOptions={availableGroups.map(tag => ({ id: tag.id, text: tag.id }))}
          onTagAdd={(tag) => addTag(doc, character.id, { id: tag, type: 'group' })}
          onTagRemove={(tag) => removeTag(doc, character.id, tag)}
          activeTagIndex={activeGroup} setActiveTagIndex={setActiveGroup} />
      </Field>
    </FieldGroup>
    <FieldGroup>
      <Toggle obj={character} field="detailsReady" label="Ranskalaiset valmiit" />
      <Toggle obj={character} field="contactsReady" label="Kontaktit valmiit" />
      <Toggle obj={character} field="detailsChecked" label="Ranskalaiset tarkistettu" className="text-blue-500" />
      <Toggle obj={character} field="contactsChecked" label="Kontaktit tarkistettu" className="text-blue-500" />
    </FieldGroup>
    <FieldGroup>
      <Field id="description" label="Pelinjohdon kuvaus" grow>
        <TextEditor fragment={character.details} />
      </Field>
    </FieldGroup>
  </div>
}

const ContactsView = ({ character }: { character: Character }) => {
  const doc = useContext(PROJECT);
  const [errors, setErrors] = useState<string[]>([]);

  const checkContacts = () => {
    const result = validate(doc, character, [
      validateContactCount,
      validateGroupContacts,
      validateOneSidedContacts
    ]);
    setErrors(result.pass ? ['Kaikki kunnossa!'] : result.messages);
  };

  return <div>
    <Button onClick={checkContacts}>Tarkasta kontaktit</Button>
    {errors.map(error => <Alert key={error}>{error}</Alert>)}
    <ContactList chId={character.id} />
  </div>
}

const SettingsView = ({ character }: { character: Character }) => {
  const doc = useContext(PROJECT);
  return <div>
    <FieldGroup>
      <Toggle obj={character} field="ignoreContactCounts" label="Ohita kontaktimäärien tarkastus" />
      <Toggle obj={character} field="ignoreMissingGroupContacts" label="Ohita ryhmien kontaktien tarkastus" />
    </FieldGroup>
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Poista hahmo</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Haluatko varmasti poistaa hahmon <CharacterName character={character} />?</AlertDialogTitle>
        <AlertDialogDescription>
          Hahmon poistaminen on peruuttamaton toimi.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Peru</AlertDialogCancel>
          <AlertDialogAction onClick={() => {
            deleteCharacter(doc, character.id);
            navigate('../..');
          }}>Poista hahmo!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}

export const CharacterName = ({character}: {character: Character}) => {
  if (character.name.length == 0) {
    return <>{character.workName}</>
  }
  return <>{character.name} ({character.workName})</>;
}