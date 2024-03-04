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
import OverlayTuto from './components/OverlayTuto';
import { useState } from 'react';
import { useTutorialStateMachine, TutorialSteps } from './hooks/useTutorialStateMachine';

function App() {
  // const { id } = useParams<{ id?: string }>();

  const { game_state } = useElementStore((state) => state);
  const [isTuto, setIsTuto] = useState(true);

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
  const { me, isItMyTurn } = useMe();

  const gameState = 'STATE_1'; // Vous devez définir votre état de jeu ici

  const { currentStep, nextStep, resetTutorial } = useTutorialStateMachine(gameState);

  const handleCloseTuto = () => {
    setIsTuto(false);
  };

  const handleClickTuto = () => {
    setIsTuto(true);
  };

  const handleNextStep = () => {
    nextStep(); // Advance to the next step of the tutorial
  };

  return (
    <>
      <Toaster />
      {isItMyTurn && isTuto && (
        <>
          {currentStep === TutorialSteps.STEP_1 && (
            // Affichez le tutoriel correspondant à l'étape 1
            <OverlayTuto
              texts={['Here, you can view your opponents, the tiles they control, their cards, and their army size.']}
              onClose={handleCloseTuto}
              top={70}
              left={73}
              width={27}
              height={40}
              radius={7}
              handleNextStep={handleNextStep}
            />
          )}
          {currentStep === TutorialSteps.STEP_2 && (
            // Affichez le tutoriel correspondant à l'étape 2
            <OverlayTuto
              texts={['Étape 2 du tutoriel']}
              onClose={handleCloseTuto}
              top={400}
              left={600}
              handleNextStep={handleNextStep}
            />
          )}
          {currentStep === TutorialSteps.STEP_3 && (
            // Affichez le tutoriel correspondant à l'étape 3
            <OverlayTuto
              texts={['Étape 3 du tutoriel']}
              onClose={handleCloseTuto}
              top={400}
              left={600}
              handleNextStep={handleNextStep}
            />
          )}
        </>
      )}
      <div className="fixed top-0 left-0 z-[1000]">
        <DebugPanel />
      </div>
      {game_state === GameState.MainMenu && <MainMenu />}
      {game_state === GameState.Lobby && <Lobby />}
      {game_state === GameState.Game && (
        <>
          <div className="flex">
            <div className="w-full">
              <Map handleClickTuto={handleClickTuto} />
            </div>
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
