import { useContext, useState } from "react";
import { CHARACTERS, CONTACTS, GROUPS } from "./data";
import { useShallowY, useY } from "./yjs-hooks/useY";
import { ContactList } from "./contacts";
import { Input } from "./components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Button } from "./components/ui/button";
import { CircleXIcon } from "lucide-react";
import * as Y from 'yjs';
import { navigate } from "wouter/use-browser-location";
import { Label } from "./components/ui/label";
import { Tag, TagInput } from 'emblor';
import { Badge } from "./components/ui/badge";

export const CharacterList = () => {
    const charactersCtx = useContext(CHARACTERS);
    const contactsCtx = useContext(CONTACTS);
    const characters = useShallowY(charactersCtx);

    const characterList: {id: string, name: string, workName: string}[] = [];
    for (const id of Object.keys(characters)) {
        const char = characters[id];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        characterList.push({...char})
    }

    // Convert groups to members to members to groups
    const groupsToCharacters = useY(useContext(GROUPS));
    const charactersToGroups: Map<string, string[]> = new Map();
    for (const [groupId, members] of Object.entries(groupsToCharacters)) {
        for (const member of Object.keys(members)) {
            let groups = charactersToGroups.get(member);
            if (!groups) {
                groups = [];
                charactersToGroups.set(member, groups);
            }
            groups.push(groupId)
        }
    }

    const createCharacter = () => {
        const id = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
        const char = new Y.Map<string>();
        charactersCtx.set(id, char);
        char.set('id', id);
        char.set('name', '');
        char.set('workName', '');
        navigate(`characters/${id}`);
    };

    const destroyCharacter = (id: string) => {
        const ok = confirm(`Haluatko varmasti TUHOTA hahmon ${characters[id].name || characters[id].workName}?`);
        if (ok) {
            charactersCtx.delete(id);
        }
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
                {characterList.map((character) => 
                    <TableRow key={character.id} onClick={() => navigate(`/characters/${character.id}`)} className="cursor-grab">
                        <TableCell>{character.name}</TableCell>
                        <TableCell>{character.workName}</TableCell>
                        <TableCell className="flex gap-2">
                            {charactersToGroups.get(character.id)?.map(group => <Badge>{group}</Badge>)}
                        </TableCell>
                        <TableCell className="w-0">
                            <Button variant="ghost" size="icon" onClick={() => destroyCharacter(character.id)}>
                                <CircleXIcon />
                            </Button> 
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
        <div>
            Yhteensä {characterList.length} hahmoa, joilla toisiinsa {contactsCtx.size} kontaktia.
        </div>
        <Button variant="outline" onClick={createCharacter}>Luo hahmo...</Button>
    </div>
}

export const CharacterSheet = ({id}: {id: number}) => {
    const characters = useContext(CHARACTERS);
    const self = characters.get(`${id}`);
    const view = useY(self ?? new Y.Map<string>());

    // Figure out this character's groups
    const groupsCtx = useContext(GROUPS);
    const allGroups = useY(groupsCtx);
    const ownGroups: Tag[] = [];
    const groupMates: Set<number> = new Set();
    const groupCompletions: Tag[] = [];
    const [activeGroup, setActiveGroup] = useState<number | null>(null);
    for (const [groupId, members] of Object.entries(allGroups)) {
        if (id in members) {
            ownGroups.push({id: groupId, text: groupId});
            Object.keys(members).forEach(mate => groupMates.add(parseInt(mate)));
        }
        if (Object.entries(members).length > 0) {
            // Offer existing non-empty groups in autocomplete
            groupCompletions.push({id: groupId, text: groupId});
        }
    }
    groupMates.delete(id);

    const addGroup = (group: string) => {
        let members = groupsCtx.get(group);
        if (!members) {
            members = new Y.Map();
            groupsCtx.set(group, members);
        }
        members.set(`${id}`, true);
    }

    const removeGroup = (group: string) => {
        const members = groupsCtx.get(group);
        if (members) {
            members.delete(`${id}`);
        }
    }

    if (!self) {
        navigate('/');
        return null;
    }

    return <div>
        <h1 className="text-4xl p-2">
            <input placeholder="Hahmon nimi" value={view.name} onChange={(event) => self.set('name', event.target.value)} className="outline-none max-w-md" />
        </h1>
        <div className="flex flex-col gap-2 max-w-md">
            <div className="flex items-center space-x-2">
                <Label htmlFor="workname">Työnimi</Label>
                <Input name="workname" value={view.workName} onChange={(event) => self.set('workName', event.target.value)} />
            </div>
            <div className="flex items-center space-x-2">
                <Label htmlFor="groups">Ryhmät</Label>
                <TagInput name="groups" tags={ownGroups} setTags={() => null}
                    enableAutocomplete={true} autocompleteOptions={groupCompletions}
                    onTagAdd={addGroup} onTagRemove={removeGroup}
                    activeTagIndex={activeGroup} setActiveTagIndex={setActiveGroup} />
            </div>
        </div>
        <ContactList owner={id} groupContacts={groupMates} />
    </div>
};
