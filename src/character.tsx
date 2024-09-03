import { useContext } from "react";
import { CHARACTERS } from "./data";
import { useShallowY, useY } from "./yjs-hooks/useY";
import { ContactList } from "./contacts";
import { Input } from "./components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Button } from "./components/ui/button";
import { CircleXIcon } from "lucide-react";
import * as Y from 'yjs';
import { navigate } from "wouter/use-browser-location";

export const CharacterList = () => {
    const charactersCtx = useContext(CHARACTERS);
    const characters = useShallowY(charactersCtx);
    const characterList: {id: string, name: string, workName: string}[] = [];
    for (const id of Object.keys(characters)) {
        const char = characters[id];
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        characterList.push({...char})
    }

    const createCharacter = () => {
        const id = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
        const char = new Y.Map<string>();
        charactersCtx.set(id, char);
        char.set('id', id);
        char.set('name', '');
        char.set('workName', '');
    };

    const destroyCharacter = (id: string) => {
        const ok = confirm(`Haluatko varmasti TUHOTA hahmon ${characters[id].workName}?`);
        if (ok) {
            charactersCtx.delete(id);
        }
    }

    return <div>
        <Button variant="outline" onClick={createCharacter}>Luo hahmo...</Button>
        <Table>
            <TableCaption>Kaikki hahmot</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Nimi</TableHead>
                    <TableHead>Työnimi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {characterList.map((character) => 
                    <TableRow key={character.id} onClick={() => navigate(`/characters/${character.id}`)} className="cursor-grab">
                        <TableCell>{character.name}</TableCell>
                        <TableCell>{character.workName}</TableCell>
                        <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => destroyCharacter(character.id)}>
                                <CircleXIcon />
                            </Button> 
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
}

export const CharacterSheet = ({id}: {id: number}) => {
    const characters = useContext(CHARACTERS);
    const self = characters.get(`${id}`);
    const view = useY(self ?? new Y.Map<string>());
    if (!self) {
        navigate('/');
        return null;
    }

    return <div>
        <h1 className="text-4xl p-2">
            <input placeholder="Hahmon nimi" value={view.name} onChange={(event) => self.set('name', event.target.value)} className="outline-none max-w-md" />
        </h1>
        <Input placeholder="Työnimi" value={view.workName} onChange={(event) => self.set('workName', event.target.value)} className="max-w-md" />
        <ContactList owner={id} />
    </div>
};
