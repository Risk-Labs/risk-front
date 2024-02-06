import { HasValue, defineSystem } from '@dojoengine/recs';
import { useEffect } from 'react';
import './App.css';
import { useDojo } from './DojoContext';
import NewGame from './components/NewGame';
import PlayPanel from './components/PlayPanel';
import SidePlayerInfo from './components/SidePlayerInfo';
import Map from './components/map/Map';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { useComponentStates } from './hooks/useComponentState';
import { useLogs } from './hooks/useLogs';
import { Phase, useElementStore } from './utils/store';

function App() {
  const {
    setup: {
      clientComponents: { Game },
      world,
      updates: {
        eventUpdates: { createSupplyEvents },
      },
    },
    account: { account },
  } = useDojo();
  const { playerIds } = useComponentStates();

  const { current_state, set_game_id, set_game } = useElementStore((state) => state);

  const isFortifyPanelVisible =
    current_state === Phase.FORTIFY || current_state === Phase.ATTACK || current_state === Phase.DEPLOY;

  useEffect(() => {
    defineSystem(world, [HasValue(Game, { host: BigInt(account.address) })], ({ value: [newGame] }: any) => {
      set_game_id(newGame.id);
      console.log(newGame);
      set_game(newGame);
    });
  }, [account]);

  const { logs } = useLogs();
  useEffect(() => {
    logs.map((l) => console.log(`[${l.timestamp}]`, l.log));
  }, [logs]);

  return (
    <>
      <Toaster />
      <TooltipProvider>
        <NewGame />
        <div className="flex">
          <div className="w-full">
            <Map />
          </div>
        </div>
        <div className="absolute top-24 right-0 flex gap-14 flex-col">
          {playerIds.map((entityId, index) => (
            <SidePlayerInfo key={index} index={index} entityId={entityId} />
          ))}
        </div>
      </TooltipProvider>
      <div className="flex justify-center">
        {playerIds.map((entityId, index) => (
          <PlayPanel key={index} index={index} entityId={entityId} />
        ))}
      </div>
    </>
  );
}

export default App;
