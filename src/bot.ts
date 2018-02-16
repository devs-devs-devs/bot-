// import { RtmClient, CLIENT_EVENTS } from '@slack/client';
// import Logger from './services/Logger';
//
// const token = process.env.BOT3_SLACK_TOKEN;
// const appData: any = {};
// let rtm;
//
// export default class Bot3 {
//
//     constructor(app: any) {
//
//         Logger.info({ token });
//
//
//         rtm = new RtmClient(token, {
//             dataStore:false,
//             useRtmConnect:true
//         });
//
//         // The client will emit an RTM.AUTHENTICATED event on when the connection data is avaiable
//         // (before the connection is open)
//         rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
//             // Cache the data necessary for this app in memory
//             appData.selfId = connectData.self.id;
//             Logger.info({ botId: appData.selfId, teamId: connectData.team.id });
//             console.log(`Logged in as ${appData.selfId} of team ${connectData.team.id}`);
//         });
//
//         // The client will emit an RTM.RTM_CONNECTION_OPEN the connection is ready for
//         // sending and recieving messages
//         rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPEN, () => {
//             console.log(`Ready`);
//         });
//
//         // Start the connecting process
//         rtm.start();
//
//     }a
//
// }
