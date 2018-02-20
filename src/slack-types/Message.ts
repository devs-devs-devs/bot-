import BotData from '../services/Data';
import Logger from '../services/Logger';
import { Pool } from 'mysql2/promise';
import * as md5 from 'md5';
import { CommandInterface } from '../commands/Command';
import Seen from '../commands/Seen';
import IInstall from '../interfaces/iinstall';
import _ = require('lodash');

const TRIGGER_PREFIX: string = '!';
const pool: Pool = BotData.getPool();

const registeredCommands = [
    new Seen()
];

export default class Message {

    public static async in(install: IInstall, event: any) {
        const obj = Message.installObj(install);

        Logger.info('Message', {teamId: _.get(install, 'store.teamId'), event});

        if ( (event.subtype && event.subtype === 'bot_message') ||
            (!event.subtype && event.user === obj.botId) ) {
            return;
        }

        switch (event.subtype) {

            case 'message_replied':
                // TODO use web api to get replies
                // Expose express to be pushed edits and replies
                return Message.repliedMessage(obj, event);

            case 'message_deleted':
                return Message.deletedMessage(obj, event);

            case 'message_changed':
                return Message.updateMessage(obj, event);

            default:
                if (event.subtype) return;
                return Message.writeMessage(obj, event);

        }
    }

    public static async writeMessage(obj: any, event: any) {

        const message = event.message ? event.message : event;
        const { teamId } = obj;
        if (event.subtype) message.subtype = event.subtype
        message.team = teamId;
        message.thumb = Message.thumb(message.ts, message.channel, message.user, teamId);
        if (message.source_team) delete message.source_team;
        if (message.attachments) message.attachments = JSON.stringify(message.attachments);
        await pool.query('INSERT INTO `events` SET ?', message);
        Message.runTriggers(obj, message);
    }

    public static async updateMessage(obj: any, event: any) {
        console.log('UPDATED MESSAGE', event);

        const team = obj.teamId;
        const { channel, message, subtype } = event;
        const { ts, user, type, text, attachments = null } = message;

        const thumb = Message.thumb(ts, channel, user, team);

        await pool.query('UPDATE `events` SET edited = ? WHERE thumb = ?', [event.ts, thumb]);
        await Message.writeMessage(obj, { thumb, ts, type, subtype, channel, user, text, team, attachments })

        // const { teamId } = obj;
        // const { channel, message: { ts, user } } = event;
        // event.message.channel = channel;
        // const thumb = Message.thumb(ts, channel, user, teamId);
        // await pool.query('UPDATE `events` SET edited = ? WHERE thumb = ?', [event.ts, thumb]);
        // await Message.writeMessage(obj, event.message);
    }

    public static async deletedMessage(obj: any, event: any) {
        const { teamId } = obj;
        const { channel, previous_message: { ts, user } } = event;
        const thumb = Message.thumb(ts, channel, user, teamId);
        await pool.query('UPDATE `events` SET edited = ? WHERE thumb = ?', [event.deleted_ts, thumb]);
    }

    public static async repliedMessage(obj: any, event: any) {
        const { teamId } = obj;
    }

    public static thumb(ts: any, channel: string, user:string, team: string) {
        return md5(Array.from(arguments).join(''));
    }

    public static async runTriggers(obj: any, message: any) {

        const { rtm } = obj.install;

        const trigger = message.text.split(' ', 1)[0];
        const triggerPhrase = trigger.substr(1).toLowerCase();
        const RC = registeredCommands.filter(command => {
            return command.commands.indexOf(triggerPhrase) !== -1;
        });
        if (RC.length === 1) {
            const command = RC[0];
            message.triggerPhrase = triggerPhrase;
            const reply = await command.reply(message);
            if (reply === null) return;
            rtm.sendMessage(reply, message.channel)
                .then(() => console.log('message sent'))
                .catch((err: any) => Logger.error(err));
        }
    }

    public static splitTrigger(text: string, trigger: string): string[] {
        return [trigger, text.substring(trigger.length + 1)];
    }

    public static installObj(install: IInstall) {
        const store = _.get(install, 'store', null);
        const rtm = _.get(install, 'rtm', null);
        const botId = _.get(install, 'store.botId', null);
        const teamId = _.get(install, 'store.teamId', null);
        if (!install || !store || !rtm || !botId || !teamId) throw new Error('invalid install');
        return { install, store, botId, teamId };
    }

}


// Logger.info(message);
//
// // Process different message types here
//
// this.pool.query('INSERT INTO `chat` SET ?', message);
//
// if ( (message.subtype && message.subtype === 'bot_message') ||
//     (!message.subtype && message.user === store.botId) ) {
//     return;
// }
//
// // DO BOTT STUFF HERE
