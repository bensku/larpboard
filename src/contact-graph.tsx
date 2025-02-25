import { useContext } from 'react';
import GraphView from './components/graph';
import { PROJECT } from './data';
import { Character, useCharacters } from './data/character';
import { useAllContacts } from './data/contact';
import { CharacterCard, CharacterName, CharacterStatus } from './character';
import { BadgeGroup } from './badge';
import { useTags } from './data/tag';
import { Link } from 'wouter';
import { AlignCenterIcon, ExternalLinkIcon } from 'lucide-react';
import InfinitePanContainer from './components/infinite';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './components/ui/hover-card';
import { cn } from './lib/utils';

export const ContactGraph = ({ centerOn }: { centerOn?: string }) => {
  const doc = useContext(PROJECT);
  const characters = useCharacters(doc);
  const nodes = characters.map((c) => ({ id: c.id, data: c }));
  const contacts = useAllContacts(doc);
  const edges = contacts.map((c) => ({
    source: c.aId,
    target: c.bId,
    color: c.close ? 'black' : 'gray',
  }));

  if (nodes.length == 0) {
    return <div>Loading...</div>;
  }
  centerOn = centerOn ?? nodes[0].id;

  return (
    <div className="h-screen w-screen">
      <InfinitePanContainer>
        <GraphView
          nodes={nodes}
          edges={edges}
          centerNodeId={centerOn}
          nodeRenderer={(node) => (
            <GraphCharacter
              character={node.data}
              centeredOn={centerOn == node.id}
            />
          )}
          collisionSize={140}
        />
      </InfinitePanContainer>
    </div>
  );
};

const GraphCharacter = ({
  character,
  centeredOn,
}: {
  character: Character;
  centeredOn: boolean;
}) => {
  const doc = useContext(PROJECT);
  const groups = useTags(doc, character.id)[0].filter(
    (tag) => tag.type == 'group',
  );

  return (
    <div
      className={cn(
        'bg-white w-48 h-32 rounded-lg shadow-md p-2',
        centeredOn ? 'bg-gray-100 border-2 border-blue-400' : '',
      )}
    >
      <HoverCard>
        <HoverCardTrigger>
          <h1 className="flex flex-col pb-2">
            <CharacterName character={character} />
          </h1>
          <BadgeGroup groups={groups} />
          <div className="flex pt-2">
            <CharacterStatus char={character} />
            <div className="flex-1 flex justify-end gap-2">
              <Link
                href={`/graph/${character.id}`}
                className={centeredOn ? 'text-gray-300' : ''}
              >
                <AlignCenterIcon />
              </Link>
              <Link href={`/characters/${character.id}`}>
                <ExternalLinkIcon />
              </Link>
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent className="w-96">
          <CharacterCard character={character} />
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};
