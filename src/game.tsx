import * as Y from 'yjs';
import { PROJECT } from './data'
import { Route, Switch } from 'wouter';
import { CharacterList, CharacterView } from './character';
import { IndexeddbPersistence } from 'y-indexeddb';

export const Game = () => {
  const doc = new Y.Doc();
  new IndexeddbPersistence('game', doc);
  // const characters = doc.getMap('characters');
  // const char1 = new Y.Map();
  // characters.set('1', char1);
  // char1.set('id', '1');
  // char1.set('name', 'Testi Testilä');
  // char1.set('workName', 'Testityyppi');

  // const char2 = new Y.Map();
  // characters.set('2', char2);
  // char2.set('id', '2');
  // char2.set('name', 'Matti Meikäläinen');
  // char2.set('workName', 'Jokapaikanhöylä');

  // <h1 className="text-4xl p-2">
  //   <input placeholder="Pelin nimi" value={view.name} onChange={(event) => self.set('name', event.target.value)} className="outline-none max-w-md" />
  // </h1>

  return <div className="max-w-5xl ml-auto mr-auto">
      <PROJECT.Provider value={doc}>
        <Switch>
          <Route path="/characters/:id">
            {({id}) => <CharacterView id={id} />}
          </Route>
          <Route>
            <CharacterList />
          </Route>
        </Switch>
      </PROJECT.Provider>
    </div>
}
