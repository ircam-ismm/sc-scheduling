import 'source-map-support/register';
import { Server } from '@soundworks/core/server';
import path from 'path';
import serveStatic from 'serve-static';
import compile from 'template-literal';

import pluginSyncFactory from '@soundworks/plugin-sync/server';

import PlayerExperience from './PlayerExperience.js';
import transportSchema from './schemas/transport.js';

import getConfig from '../utils/getConfig.js';
const ENV = process.env.ENV || 'default';
const config = getConfig(ENV);
const server = new Server();

// html template and static files (in most case, this should not be modified)
server.templateEngine = { compile };
server.templateDirectory = path.join('.build', 'server', 'tmpl');
server.router.use(serveStatic('public'));
server.router.use('build', serveStatic(path.join('.build', 'public')));
server.router.use('vendors', serveStatic(path.join('.vendors', 'public')));

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${ENV}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

(async function launch() {

  let mod = await import('../../../../src/index.js');
  const { Scheduler, Transport } = mod;

  mod = await import('@ircam/sc-gettime');
  const { getTime } = mod;

  // -------------------------------------------------------------------
  // register plugins
  // -------------------------------------------------------------------
  server.pluginManager.register('sync', pluginSyncFactory, {
    getTimeFunction: getTime,
  }, []);

  // -------------------------------------------------------------------
  // register schemas
  // -------------------------------------------------------------------
  server.stateManager.registerSchema('transport', transportSchema);

  try {
    await server.init(config, (clientType, config, httpRequest) => {
      return {
        clientType: clientType,
        app: {
          name: config.app.name,
          author: config.app.author,
        },
        env: {
          type: config.env.type,
          websockets: config.env.websockets,
          subpath: config.env.subpath,
        }
      };
    });

    const sync = server.pluginManager.get('sync');
    const getTimeFunction = () => sync.getSyncTime();
    const scheduler = new Scheduler(getTimeFunction);
    const clock = new Transport(scheduler);

    const transport = await server.stateManager.create('transport', {
      transportState: clock.getState(),
    });

    server.stateManager.registerUpdateHook('transport', (updates, currentValues) => {
      if (updates.command) {
        const { command } = updates;
        const { enablePreRoll, preRollDuration } = currentValues;
        const applyAt = sync.getSyncTime() + 0.1;

        const clockEvents = [
          {
            type: 'cancel',
            time: applyAt,
          },
        ];

        switch (command) {
          case 'start':
            clockEvents.push({
              type: 'play',
              time: enablePreRoll ? applyAt + preRollDuration : applyAt,
            });
            break;
          case 'stop':
            clockEvents.push({
              type: 'pause',
              time: applyAt,
            });
            clockEvents.push({
              type: 'seek',
              time: applyAt,
              position: 0,
            });
            break;
          case 'pause':
            clockEvents.push({
              type: 'pause',
              time: applyAt,
            });
            break;
          case 'seek':
            clockEvents.push({
              type: 'seek',
              time: applyAt,
              position: updates.seekPosition || currentValues.seekPosition,
            });
            break;
          case 'loop':
            clockEvents.push({
              type: 'loop',
              time: applyAt,
              loop: updates.loop,
            });
            break;
        }

        const preRollEvents = [{
          type: 'cancel',
          time: applyAt,
        }];

        if (enablePreRoll && clockEvents.length > 0) {
          if (command === 'start') {
            preRollEvents.push({
              type: 'seek',
              time: applyAt,
              position: -1 * (preRollDuration + 1),
            })
            preRollEvents.push({
              type: 'play',
              time: applyAt,
            });
            preRollEvents.push({
              type: 'pause',
              time: applyAt + preRollDuration,
            });
            preRollEvents.push({
              type: 'seek',
              time: applyAt + preRollDuration,
              position: 0,
            });
          } else {
            // for seek, pause and stop, we want to stop the playroll now
            preRollEvents.push({
              type: 'pause',
              time: applyAt,
            });
            preRollEvents.push({
              type: 'seek',
              time: applyAt,
              position: 0,
            });
          }
        }

        return {
          ...updates,
          clockEvents,
          preRollEvents,
        };
      }
    });

    const playerExperience = new PlayerExperience(server, 'player');
    // start all the things
    await server.start();
    playerExperience.start();

    transport.subscribe(updates => {
      if (updates.clockEvents) {
        updates.clockEvents.map(event => clock.addEvent(event));
      }
    });

    const engine = {
      onTransportEvent(event, position, currentTime, dt) {
        console.log(event, position, currentTime, dt);
        const transportState = clock.getState();
        transport.set({ transportState });

        return event.speed > 0 ? position : 10^9;
      },
      advanceTime(position, currentTime, dt) {
        console.log(position, currentTime, dt);
        return position + 0.25;
      }
    };

    clock.add(engine);

    // setInterval(() => {
    //   const now = getTimeFunction();
    //   const position = clock.getPositionAtTime(now);
    //   console.log(position);
    // }, 250);

  } catch (err) {
    console.error(err.stack);
  }
})();

process.on('unhandledRejection', (reason, p) => {
  console.log('> Unhandled Promise Rejection');
  console.log(reason);
});
