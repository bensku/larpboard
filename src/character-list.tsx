import { useContext, useLayoutEffect, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  Character,
  createCharacter,
  posSource,
  updateCharacter,
  useCharacters,
} from './data/character';
import { Tag, useAllTags } from './data/tag';
import { PROJECT } from './data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table';
import { navigate } from 'wouter/use-browser-location';
import { Button } from './components/ui/button';
import { GripVerticalIcon, LinkIcon, UnlinkIcon } from 'lucide-react';
import { Link } from 'wouter';
import {
  CharacterName,
  CharacterStatus,
  FastCharacterCard,
} from './character';
import { BadgeGroup } from './badge';
import { Checkbox } from './components/ui/checkbox';
import { Label } from './components/ui/label';

const SortableRow = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <Link asChild to={`/characters/${id}`}>
      <TableRow ref={setNodeRef} style={style}>
        {children}
        <td {...attributes} {...listeners}>
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

  const [cardMode, setCardMode] = useState(false);

  useLayoutEffect(() => {
    setCardMode(localStorage.getItem('characterList.cardMode') === 'true');
  }, []);

  // Figure out what tags we have and which characters they belong to
  // For now, only do this for groups - might have other tags later
  const characterGroups: Map<string, Tag[]> = new Map();
  const allTags = useAllTags(doc);
  const groups = allTags.filter((tag) => tag.type == 'group');
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
    navigate(`characters/${id}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = characters.findIndex((c) => c.id === active.id);
    const newIndex = characters.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Swap characters in list before we start calculating position CRDTs
    // This avoids some VERY cursed math in position calculations
    const char = characters[oldIndex];
    characters.splice(oldIndex, 1);
    characters.splice(newIndex, 0, char);

    const newPos = posSource.createBetween(
      characters[newIndex - 1]?.sortKey,
      characters[newIndex + 1]?.sortKey,
    );

    updateCharacter(doc, char.id, {
      sortKey: newPos,
    });
  };

  return (
    <div className="pl-3 pr-3">
      <div className="flex items-center gap-4 p-4">
        <div>Yhteensä {characters.length} hahmoa.</div>
        <Button variant="outline" onClick={newCharacter}>
          Luo hahmo...
        </Button>
        <div className="flex flex-row space-x-2 mb-2">
          <Label htmlFor={'cardMode'} className="ml-3 mb-1">
            Näytä kortteina
          </Label>
          <Checkbox
            name="cardMode"
            checked={cardMode}
            onCheckedChange={(checked) => {
              setCardMode(!!checked);
              localStorage.setItem(
                'characterList.cardMode',
                checked ? 'true' : 'false',
              );
            }}
          />
        </div>
      </div>
      {cardMode ? (
        <CardView characters={characters} characterGroups={characterGroups} />
      ) : (
        <ListView
          characters={characters}
          characterGroups={characterGroups}
          handleDragEnd={handleDragEnd}
        />
      )}
    </div>
  );
};

const ListView = ({
  characters,
  characterGroups,
  handleDragEnd,
}: {
  characters: Character[];
  characterGroups: Map<string, Tag[]>;
  handleDragEnd: (event: DragEndEvent) => void;
}) => {
  return (
    <div>
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
          <SortableContext
            items={characters.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {characters.map((char) => (
                <SortableRow key={char.id} id={char.id}>
                  <TableCell>{char.writerName}</TableCell>
                  <TableCell className="flex gap-2">
                    <BadgeGroup groups={characterGroups.get(char.id) ?? []} />
                  </TableCell>
                  <TableCell className="items-center">
                    <CharacterStatus char={char} />
                  </TableCell>
                  <TableCell>
                    <CharacterName character={char} />
                  </TableCell>
                  <TableCell>{char.blurb}</TableCell>
                  <TableCell>
                    {char.playerDescLink ? (
                      <a href={char.playerDescLink}>
                        <LinkIcon />
                      </a>
                    ) : (
                      <UnlinkIcon />
                    )}
                  </TableCell>
                </SortableRow>
              ))}
            </TableBody>
          </SortableContext>
        </Table>
      </DndContext>
    </div>
  );
};

const CardView = ({
  characters,
  characterGroups,
}: {
  characters: Character[];
  characterGroups: Map<string, Tag[]>;
}) => {
  return (
    <div className="flex flex-wrap">
      {characters.map((char) => (
        <div
          key={char.id}
          className="w-96 bg-gray-50 rounded-lg shadow-md p-2 m-2"
        >
          <Link to={`/characters/${char.id}`}>
            <div className="h-56 overflow-hidden">
              <FastCharacterCard
                character={char}
                groupTags={characterGroups.get(char.id) ?? []}
              />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};
