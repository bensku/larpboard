import { useContext } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { createCharacter, posSource, updateCharacter, useCharacters } from "./data/character";
import { Tag, useAllTags } from "./data/tag";
import { PROJECT } from "./data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { navigate } from "wouter/use-browser-location";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { GripVerticalIcon, LinkIcon, UnlinkIcon } from "lucide-react";
import { Link } from "wouter";
import { CharacterName, CharacterStatus } from "./character";

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <Link asChild to={`/characters/${id}`}>
      <TableRow
        ref={setNodeRef}
        style={style}
      >
          {children}
        <td
          {...attributes}
          {...listeners}
          >
          <GripVerticalIcon />
        </td>
      </TableRow>
    </Link>
  );
};

export const CharacterList = () => {
  const doc = useContext(PROJECT);
  const characters = useCharacters(doc);
  characters.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

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
    navigate(`characters/${id}`)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = characters.findIndex(c => c.id === active.id);
    const newIndex = characters.findIndex(c => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Swap characters in list before we start calculating position CRDTs
    // This avoids some VERY cursed math in position calculations
    const char = characters[oldIndex];
    characters.splice(oldIndex, 1);
    characters.splice(newIndex, 0, char);

    const newPos = posSource.createBetween(
      characters[newIndex - 1]?.sortKey,
      characters[newIndex + 1]?.sortKey
    );

    updateCharacter(doc, char.id, {
      sortKey: newPos,
    });
  };

  return <div>
    <DndContext 
      modifiers={[restrictToVerticalAxis]} 
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Kirjoittaja</TableHead>
            <TableHead className="w-[150px]">Ryhmät</TableHead>
            <TableHead className="w-[150px]">Status</TableHead>
            <TableHead className="w-[250px]">Nimi</TableHead>
            <TableHead>Hahmo hyvin lyhyesti</TableHead>
            <TableHead>Kuvaus</TableHead>
          </TableRow>
        </TableHeader>
        <SortableContext items={characters.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <TableBody>
            {characters.map((char) =>
              <SortableRow key={char.id} id={char.id}>
                <TableCell>{char.writerName}</TableCell>
                <TableCell className="flex gap-2">
                  {characterGroups.get(char.id)?.map(group => <Badge key={group.id} variant="secondary">{group.id}</Badge>)}
                </TableCell>
                <TableCell className="items-center">
                  <CharacterStatus char={char} />
                </TableCell>
                <TableCell><CharacterName character={char} /></TableCell>
                <TableCell>{char.blurb}</TableCell>
                <TableCell>
                  {char.playerDescLink ? <a href={char.playerDescLink}>
                    <LinkIcon />
                  </a> : <UnlinkIcon />}
                </TableCell>
              </SortableRow>
            )}
          </TableBody>
        </SortableContext>
      </Table>
    </DndContext>
    <div>
      Yhteensä {characters.length} hahmoa.
    </div>
    <Button variant="outline" onClick={newCharacter}>Luo hahmo...</Button>
  </div>;
};


