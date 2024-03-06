import { BATTLE_EVENT, DEFEND_EVENT, FORTIFY_EVENT, SUPPLY_EVENT } from '@/constants';
import { useDojo } from '@/dojo/useDojo';
import { fetchEventsOnce, fetchEventsTxHash } from '@/services/fetchEvents';
import {
  Event,
  createBattleLog,
  createDefendLog,
  createFortifyLog,
  createSupplyLog,
  parseBattleEvent,
  parseDefendEvent,
  parseFortifyEvent,
  parseSupplyEvent,
} from '@/utils/events';
import { useElementStore } from '@/utils/store';
import { Battle, BattleEvent, Player } from '@/utils/types';
import { useEffect, useRef, useState } from 'react';
import { Subscription } from 'rxjs';
import { useGetPlayers } from './useGetPlayers';
import { useGame } from './useGame';
import { getBattleFromBattleEvents } from '@/utils/battle';

export enum EventType {
  Supply,
  Defend,
  Fortify,
}

export type LogType = {
  timestamp: number;
  log: string[];
  regionFrom?: number;
  regionTo?: number;
  battle?: Battle;
  type: EventType;
};

const generateLogFromEvent = (event: Event, playerList: Player[]): LogType => {
  if (event.keys[0] === SUPPLY_EVENT) {
    return createSupplyLog(parseSupplyEvent(event), playerList);
  } else if (event.keys[0] === DEFEND_EVENT) {
    return createDefendLog(parseDefendEvent(event), playerList);
  } else if (event.keys[0] === FORTIFY_EVENT) {
    return createFortifyLog(parseFortifyEvent(event), playerList);
  } else {
    console.log('qqqqqqqqqqqqq', event);
    // if (event.keys[0] === BATTLE_EVENT)
    return createBattleLog(parseBattleEvent(event), playerList);
  }
};

export const useLogs = () => {
  const [logs, setLogs] = useState<LogType[]>([]);
  const { setLastDefendResult, tilesConqueredThisTurn, setTilesConqueredThisTurn } = useElementStore((state) => state);

  const subscribedRef = useRef(false); // Tracks whether subscriptions have been made
  const {
    setup: {
      updates: {
        eventUpdates: { createSupplyEvents, createDefendEvents, createFortifyEvents, createBattleEvents },
      },
    },
  } = useDojo();

  const game = useGame();
  const { game_id } = useElementStore((state) => state);
  const { players } = useGetPlayers();

  // Subscribe to events
  useEffect(() => {
    if (game && game_id !== undefined && players.length !== 0) {
      // Check if already subscribed to prevent duplication due to HMR
      if (!subscribedRef.current) {
        const subscriptions: Subscription[] = [];

        const subscribeToEvents = async () => {
          const supplyObservable = await createSupplyEvents(0);
          const defendObservable = await createDefendEvents(0);
          const fortifyObservable = await createFortifyEvents(0);
          //const battleObservable = await createBattleEvents(0);

          subscriptions.push(
            supplyObservable.subscribe((event) => {
              if (event) {
                setLogs((prevLogs) => [...prevLogs, generateLogFromEvent(event, players)]);
              }
            }),

            defendObservable.subscribe(async (event) => {
              if (event) {
                const log = generateLogFromEvent(event, players);

                // let's fetch all battle events for this defend event
                const battleEvents: BattleEvent[] = [];
                await fetchEventsTxHash(
                  [BATTLE_EVENT, '0x' + game_id.toString(16), '0x' + game.nonce.toString(16)],
                  event.transactionHash,
                  (event) => {
                    const battleEvent = parseBattleEvent(event);
                    battleEvents.push(battleEvent);
                  }
                );
                if (battleEvents.length !== 0) {
                  const attackerName = players[battleEvents[0].attackerIndex].name;
                  const defenderName = players[battleEvents[0].defenderIndex].name;
                  const battle = getBattleFromBattleEvents(battleEvents, attackerName, defenderName);

                  log.battle = battle;
                }

                setLogs((prevLogs) => [...prevLogs, log]);
                setLastDefendResult(event);
                if (log.log[log.log.length - 1] === 'Result: win' && log.regionTo) {
                  setTilesConqueredThisTurn([...tilesConqueredThisTurn, log.regionTo]);
                }
              }
            }),

            fortifyObservable.subscribe((event) => {
              if (event) {
                setLogs((prevLogs) => [...prevLogs, generateLogFromEvent(event, players)]);
              }
            })

            /*battleObservable.subscribe((event) => {
        if (event) {
          console.log('battle event', event);
          setLogs((prevLogs) => [...prevLogs, generateLogFromEvent(event, players)]);
        }
      })*/
          );

          subscribedRef.current = true; // Mark as subscribed
        };

        subscribeToEvents();

        // Cleanup function to unsubscribe
        return () => {
          console.log('Unsubscribed from all events');
          subscriptions.forEach((sub) => sub.unsubscribe());
          subscribedRef.current = false;
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, players, game_id]);

  // Fetch events history (before subscription)
  useEffect(() => {
    // Clear logs when game changes
    setLogs([]);

    const fetchEvents = async (gameId: number) => {
      await fetchEventsOnce([SUPPLY_EVENT, '0x' + gameId.toString(16)], async (event: Event) => {
        setLogs((prevLogs) => [...prevLogs, generateLogFromEvent(event, players)]);
      });
      await fetchEventsOnce([FORTIFY_EVENT, '0x' + gameId.toString(16)], async (event) =>
        setLogs((prevLogs) => [...prevLogs, generateLogFromEvent(event, players)])
      );
      await fetchEventsOnce([DEFEND_EVENT, '0x' + gameId.toString(16)], async (event) => {
        const log = generateLogFromEvent(event, players);

        // let's fetch all battle events for this defend event
        const battleEvents: BattleEvent[] = [];
        await fetchEventsTxHash(
          [BATTLE_EVENT, '0x' + gameId.toString(16), '0x' + game.nonce.toString(16)],
          event.transactionHash,
          (event) => {
            const battleEvent = parseBattleEvent(event);
            battleEvents.push(battleEvent);
          }
        );
        console.log('battleEvents', battleEvents);
        if (battleEvents.length !== 0) {
          const attackerName = players[battleEvents[0].attackerIndex].name;
          const defenderName = players[battleEvents[0].defenderIndex].name;
          const battle = getBattleFromBattleEvents(battleEvents, attackerName, defenderName);

          log.battle = battle;
        }

        console.log('log', log);
        setLogs((prevLogs) => [...prevLogs, log]);
        setLastDefendResult(event);
      });
    };

    if (game_id !== undefined) fetchEvents(game_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game_id, players]);

  return { logs: logs.sort((a, b) => a.timestamp - b.timestamp) };
};
