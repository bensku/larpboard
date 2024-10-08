import * as Y from 'yjs';
import { CHARACTERS, CONTACTS, GROUPS } from './data'
import { CharacterList, CharacterSheet } from './character';
import { Route, Switch } from 'wouter';

export const Game = () => {
  const doc = new Y.Doc();
  const characters = doc.getMap('characters');
  const char1 = new Y.Map();
  characters.set('1', char1);
  char1.set('id', '1');
  char1.set('name', 'Testi Testilä');
  char1.set('workName', 'Testityyppi');

  const char2 = new Y.Map();
  characters.set('2', char2);
  char2.set('id', '2');
  char2.set('name', 'Matti Meikäläinen');
  char2.set('workName', 'Jokapaikanhöylä');

  // <h1 className="text-4xl p-2">
  //   <input placeholder="Pelin nimi" value={view.name} onChange={(event) => self.set('name', event.target.value)} className="outline-none max-w-md" />
  // </h1>

  return <div className="max-w-5xl ml-auto mr-auto">
      <CONTACTS.Provider value={doc.getMap('contacts')}>
        <CHARACTERS.Provider value={doc.getMap('characters')}>
          <GROUPS.Provider value={doc.getMap('groups')}>
            <Switch>
              <Route path="/characters/:id">
                {({id}) => <CharacterSheet id={parseInt(id)} />}
              </Route>
              <Route>
                <CharacterList />
              </Route>
            </Switch>
          </GROUPS.Provider>
        </CHARACTERS.Provider>
      </CONTACTS.Provider>
    </div>
}
