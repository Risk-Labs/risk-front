import './App.css';
import ActionLogs from './components/ActionLogs';
import PlayPanel from './components/PlayPanel';
import Map from './components/map/Map';
import { Toaster } from './components/ui/toaster';

import GameState from './utils/gamestate';
import MainMenu from './components/MainMenu';
import Lobby from './components/Lobby';

import { useGetPlayers } from './hooks/useGetPlayers';
import { useElementStore } from './utils/store';
import PlayersPanel from './components/PlayersPanel';
import { DebugPanel } from './components/DebugPanel';
import OverlayEndGame from './components/OverlayEndGame';
import { useMe } from './hooks/useMe';
import BattleReport from './components/BattleReport/BattleReport';

function App() {
  // const { id } = useParams<{ id?: string }>();

  const { game_state, battleReport } = useElementStore((state) => state);

  // useEffect(() => {
  //   console.log('URL ID:', id);
  //   if (id !== undefined) {
  //     // Get the game with the ID from the URL
  //     defineSystem(world, [HasValue(Game, { id: Number(id) })], ({ value: [newGame] }: any) => {
  //       console.log('newGame', newGame);
  //       set_game(sanitizeGame(newGame));
  //     });
  //   } else {
  //     // Get the game that the user is hosting, if any
  //     defineSystem(world, [HasValue(Game, { host: BigInt(account.address) })], ({ value: [newGame] }: any) => {
  //       console.log('newGame', newGame);
  //       set_game(sanitizeGame(newGame));
  //     });
  //   }
  // }, [account]);

  const { players } = useGetPlayers();
  const { me } = useMe();

  return (
    <>
      <Toaster />
      <div className="fixed top-0 left-0 z-[1000]">
        <DebugPanel />
      </div>
      {game_state === GameState.MainMenu && <MainMenu />}
      {game_state === GameState.Lobby && <Lobby />}
      {game_state === GameState.Game && (
        <>
          <div className="flex">
            <div className="w-full">
              <Map />
            </div>
            {battleReport && (
              <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001]">
                <div className="p-4 bg-stone-900 rounded-lg opacity-95">
                  <BattleReport battle={battleReport} />
                </div>
              </div>
            )}
          </div>
          <div className="fixed bottom-0 left-0 w-1/4 p-1">
            <ActionLogs />
          </div>
          <div className="fixed bottom-0 right-0 w-1/4 pb-1 pr-1">
            <PlayersPanel players={players} />
          </div>
          <div className="flex justify-center">
            <PlayPanel />
          </div>
        </>
      )}
      {me && me.rank !== 0 && <OverlayEndGame me={me} players={players} />}
    </>
  );
}

export default App;
