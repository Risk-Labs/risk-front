import { useGetCurrentPlayer } from '@/hooks/useGetCurrentPlayer';
import { useGetTiles } from '@/hooks/useGetTiles';
import { usePhase } from '@/hooks/usePhase';
import { Phase, useElementStore } from '@/utils/store';
import { Milestone, ShieldPlus, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Slider } from './ui/slider';
import { useDojo } from '@/dojo/useDojo';
import OverlayDice from './OverlayDice';

const ActionPanel = () => {
  const {
    setup: {
      client: { play },
    },
    account: { account },
  } = useDojo();

  const {
    current_source,
    set_current_source,
    current_target,
    set_current_target,
    game_id,
    set_army_count: setArmyCount,
    army_count: armyCount,
  } = useElementStore((state) => state);
  const { phase } = usePhase();
  const { currentPlayer } = useGetCurrentPlayer();
  const [sourceTile, setSourceTile] = useState<any | null>(null);
  const [targetTile, setTargetTile] = useState<any | null>(null);
  const [isActionSelected, setIsActionSelected] = useState(false);
  const [isDiceAnimation, setIsDiceAnimation] = useState(false);

  useEffect(() => {
    setArmyCount(0);
    set_current_source(null);
    set_current_target(null);
  }, [phase]);

  const { tiles } = useGetTiles();

  useEffect(() => {
    if (current_source !== null) {
      const sourceTileData = tiles[current_source - 1];
      setSourceTile(sourceTileData);
      if (sourceTileData && sourceTileData.army) {
        if (phase === Phase.DEPLOY) {
          setArmyCount(currentPlayer.supply);
        } else {
          setArmyCount(sourceTileData.army - 1);
        }
      }
      setIsActionSelected(true);
    } else {
      setSourceTile(null);
      setIsActionSelected(false);
    }

    if (current_target !== null) {
      const targetTileData = tiles[current_target - 1];
      setTargetTile(targetTileData);
    } else {
      setTargetTile(null);
    }
  }, [current_source, phase, current_target]);

  const handleSupply = () => {
    if (game_id == null || game_id == undefined) return;
    if (current_source === null) return;
    if (currentPlayer && currentPlayer.supply < armyCount) {
      //todo put toast here
      console.log('Not enough supply', currentPlayer.supply, armyCount);
      // alert('Not enough supply', player.supply);
      return;
    }
    play.supply(account, game_id, current_source, armyCount);
    setArmyCount(currentPlayer.supply - armyCount);
    set_current_source(null);
  };

  const onMoveTroops = async () => {
    if (current_source === null || current_target === null) return;

    if (game_id == null || game_id == undefined) return;
    //animateArrow();
    await play.transfer(account, game_id, current_source, current_target, armyCount);
  };

  const onAttack = async () => {
    // Implement attack logic here
    if (current_source === null || current_target === null) return;

    if (game_id == null || game_id == undefined) return;

    // todo adapt to compare to source.supply
    if (currentPlayer && currentPlayer.attack < armyCount) {
      //todo put toast here
      alert('Not enough attack');
      return;
    }
    setIsDiceAnimation(true);

    await play.attack(account, game_id, current_source, current_target, armyCount);

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await sleep(100);

    play.defend(account, game_id, current_source, current_target);
    removeSelected();
    await sleep(5000);
    setIsDiceAnimation(false);
  };

  const removeSelected = (): void => {
    set_current_source(null);
    set_current_target(null);
  };

  const isAttackTurn = () => {
    return phase === Phase.ATTACK;
  };

  const isFortifyTurn = () => {
    return phase === Phase.FORTIFY;
  };

  return (
    <>
      {isDiceAnimation && <OverlayDice />}
      {isAttackTurn() ? (
        current_source &&
        current_target &&
        sourceTile.army > 1 && (
          <div
            id="parent"
            className={`flex items-center justify-around p-4 h-28 ${
              isActionSelected &&
              'border-2 rounded-lg border-primary bg-black bg-opacity-30 backdrop-blur-md drop-shadow-lg '
            } `}
          >
            <Slider
              className="w-32"
              min={1}
              max={sourceTile ? sourceTile.army - 1 : Infinity}
              value={[armyCount]}
              onValueChange={(newValue: number[]) => {
                setArmyCount(newValue[0]);
              }}
              color="red"
            ></Slider>
            <>
              <button
                onClick={onAttack}
                className="flex items-center justify-center h-10 px-2 text-white bg-red-500 rounded hover:bg-red-600 drop-shadow-lg hover:transform hover:-translate-y-1 transition-transform ease-in-out"
              >
                ATTACK <Swords className="ml-2" />
              </button>
              <button
                onClick={removeSelected}
                className="absolute top-1 right-1 flex items-center justify-center w-[22px] h-[22px] bg-red-500 text-white rounded-full text-xs"
              >
                ✕
              </button>
            </>
          </div>
        )
      ) : isFortifyTurn() ? (
        <>
          {currentPlayer && targetTile && current_source && sourceTile && sourceTile.army > 1 && current_target && (
            <div
              id="parent"
              className={`flex items-center justify-around p-4 h-28 ${
                isActionSelected &&
                'border-2 rounded-lg border-primary bg-black bg-opacity-30 backdrop-blur-md drop-shadow-lg'
              } `}
            >
              <Slider
                className="w-32"
                min={1}
                max={sourceTile.army - 1}
                value={[armyCount]}
                onValueChange={(newValue: number[]) => {
                  setArmyCount(newValue[0]);
                }}
              ></Slider>
              <button
                onClick={onMoveTroops}
                className="flex items-center justify-center h-10 px-2 text-white bg-green-500 rounded hover:bg-green-600 drop-shadow-lg hover:transform hover:-translate-y-1 transition-transform ease-in-out"
              >
                MOVE
                <Milestone className="ml-2" />
              </button>
              <button
                onClick={removeSelected}
                className="absolute top-1 right-1 flex items-center justify-center w-[22px] h-[22px] bg-red-500 text-white rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {currentPlayer && sourceTile && current_source && currentPlayer.supply > 0 && (
            <div
              id="parent"
              className={`flex items-center justify-around p-4 h-28 ${
                isActionSelected &&
                'border-2 rounded-lg border-primary bg-black bg-opacity-30 backdrop-blur-md drop-shadow-lg'
              } `}
            >
              <Slider
                className="w-32"
                min={1}
                max={currentPlayer.supply}
                value={[armyCount]}
                onValueChange={(newValue: number[]) => {
                  setArmyCount(newValue[0]);
                }}
              ></Slider>
              <button
                onClick={handleSupply}
                className="flex items-center justify-center h-10 px-2 text-white bg-green-500 rounded hover:bg-green-600 drop-shadow-lg hover:transform hover:-translate-y-1 transition-transform ease-in-out"
              >
                DEPLOY <ShieldPlus className="ml-2" />
              </button>
              <button
                onClick={removeSelected}
                className="absolute top-1 right-1 flex items-center justify-center w-[22px] h-[22px] bg-red-500 text-white rounded-full text-xs"
              >
                ✕
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};
export default ActionPanel;
