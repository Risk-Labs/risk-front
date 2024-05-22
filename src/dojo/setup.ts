import { getSyncEntities } from '@dojoengine/state';
import { DojoConfig, DojoProvider } from '@dojoengine/core';
import * as torii from '@dojoengine/torii-client';
import { createClientComponents } from './createClientComponents';
import { defineContractComponents } from './generated/contractComponents';
import { world } from './world';
import { setupWorld } from './systems';
import { TypedData, WeierstrassSignatureType } from 'starknet';
import { createUpdates } from './createUpdates';

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup({ ...config }: DojoConfig) {
  // torii client
  const toriiClient = await torii.createClient([], {
    rpcUrl: config.rpcUrl,
    toriiUrl: config.toriiUrl,
    relayUrl: '',
    worldAddress: config.manifest.world.address || '',
  });

  // create contract components
  const contractComponents = defineContractComponents(world);

  // create client components
  const clientComponents = createClientComponents({ contractComponents });

  // fetch all existing entities from torii
  await getSyncEntities(toriiClient, contractComponents as any);

  // create dojo provider
  const dojoProvider = new DojoProvider(config.manifest, config.rpcUrl);

  // setup world
  const client = await setupWorld(dojoProvider);

  // create updates manager
  const updates = await createUpdates(clientComponents);

  return {
    client,
    clientComponents,
    contractComponents,
    publish: (typedData: TypedData, signature: WeierstrassSignatureType) => {
      toriiClient.publishMessage(typedData, {
        r: signature.r.toString(),
        s: signature.s.toString(),
      });
    },
    config,
    dojoProvider,
    updates,
    world,
  };
}
