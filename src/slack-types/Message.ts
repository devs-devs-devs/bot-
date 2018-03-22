import BotData from '../services/Data';
import Logger from '../services/Logger';
import { Pool } from 'mysql2/promise';
import * as md5 from 'md5';
import Seen from '../commands/Seen';
import IInstall from '../interfaces/iinstall';
import _ = require('lodash');
import Member from './Members';
import { Emphasis } from '../commands/Emphasis';
import RightThere from '../commands/RightThere';
import Copypasta from '../commands/Copypasta';
import Trigger from '../commands/Trigger';
import { QDB } from '../commands/QDB';
import Megahal from '../services/Megahal';
import Markov from '../commands/Markov';
import { Bruh } from '../commands/Bruh';
import { Wurd } from '../commands/Wurd';

const TRIGGER_PREFIX: string = '!';
const pool: Pool = BotData.getPool();
const triggerScan = new Trigger();

const Entities = require('html-entities').AllHtmlEntities;
const entities = new Entities();

const registeredCommands = [
    new Seen(),
    new Emphasis(),
    new RightThere(),
    new Copypasta(),
    triggerScan,
    new QDB(),
    new Markov(),
    new Bruh(),
    new Wurd(),
];

export default class Message {

    public static async in(install: IInstall, event: any) {
        const obj = Message.installObj(install);

        if ((event.subtype && event.subtype === 'bot_message') ||
            (!event.subtype && event.user === obj.botId) ||
            (event.message && event.message.user === obj.botId)) {
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

            case 'channel_join':
                return Member.in(install, event);

            case 'channel_leave':
                return Member.in(install, event);

            default:
                if (event.subtype) return;
                return Message.writeMessage(obj, event);

        }
    }

    public static removeDoubleSpaces(text: string) {
        return text.split(' ').filter((word) => word !== '').join(' ');
    }

    public static async writeMessage(obj: any, event: any, runTriggers: boolean = true) {

        const message = event.message ? event.message : event;

        message.text = entities.decode(message.text);
        message.text = Message.removeDoubleSpaces(message.text);

        const {teamId} = obj;
        if (event.subtype) message.subtype = event.subtype
        message.team = teamId;
        message.thumb = Message.thumb(message.ts, message.channel, message.user, teamId);
        if (message.source_team) delete message.source_team;
        if (message.attachments) message.attachments = JSON.stringify(message.attachments);

        const {thumb, parent, ts, type, subtype, channel, user, text, team, attachments} = message;
        const writeable = {thumb, parent, ts, type, subtype, channel, user, text, team, attachments};
        await pool.query('INSERT INTO `events` SET ?', writeable);
        if (runTriggers) {
            console.log('running triggers...');
            Message.runTriggers(obj, message);
        }
    }

    public static async updateMessage(obj: any, event: any) {
        const team = obj.teamId;
        const {channel, message, subtype} = event;
        const {ts, user, type, text, attachments = null} = message;

        const thumb = Message.thumb(ts, channel, user, team);

        await pool.query('UPDATE `events` SET edited = ? WHERE thumb = ?', [event.ts, thumb]);

        const [replies] = await pool.query('SELECT * FROM `botreplys` WHERE userts = ? AND team = ? AND CHANNEL = ? AND user = ?', [message.ts, team, channel, user]) as any;

        if (replies.length) {
            const reply = replies[0];
            const command = await Message.findTrigger(obj, event);

            if (command) obj.install.rtm.updateMessage({
                ts: reply.ts,
                channel: reply.channel,
                text: await command.reply(event.message, obj) || 'Some issue fam'
            });

        }
        await Message.writeMessage(obj, {thumb, ts, type, subtype, channel, user, text, team, attachments}, false)
    }

    public static async deletedMessage(obj: any, event: any) {
        const {teamId} = obj;
        const {channel, previous_message: {ts, user}} = event;
        const thumb = Message.thumb(ts, channel, user, teamId);
        await pool.query('UPDATE `events` SET edited = ? WHERE thumb = ?', [event.deleted_ts, thumb]);
    }

    public static async repliedMessage(obj: any, event: any) {
        const {teamId} = obj;
    }

    public static thumb(ts: any, channel: string, user: string, team: string) {
        return md5(Array.from(arguments).join(''));
    }

    public static async sendMessage(obj: any, reply: any, message: any) {
        if (!reply) return;
        const {teamId} = obj;
        const {channel} = message;
        const promise = typeof reply === 'string' ? obj.install.rtm.sendMessage(reply, channel) : obj.install.rtm.send(reply);
        promise.then(async (event: any) => {
            event.userts = message.ts;
            event.thumb = Message.thumb(message.ts, message.channel, message.user, teamId);
            event.team = teamId;
            event.user = message.user;
            await pool.query('INSERT INTO `botreplys` SET ?', event);
        })
            .catch((err: any) => Logger.error(err));
        return promise;
    }

    public static async findTrigger(obj: any, message: any) {
        const trigger = message.text.split(' ', 1)[0];
        const triggerPhrase = trigger.substr(1).toLowerCase();
        message.triggerPhrase = triggerPhrase;
        message.trigger = `${TRIGGER_PREFIX}${triggerPhrase}`;
        const RC = registeredCommands.filter(command => {
            return command.commands.indexOf(triggerPhrase) !== -1;
        });
        if (RC.length) {
            console.log('Found trigger', RC[0]);
            return RC[0];
        }
        return false;
    }

    public static async runTriggers(obj: any, event: any) {

        const message = event.message ? event.message : event;

        if (message.text.substring(0, 1) !== TRIGGER_PREFIX) {
            Megahal.add(obj.teamId, message.text);
            console.log('Scanning for trigger');
            const reply = await triggerScan.scan(message, obj);
            if (reply) {
                return Message.sendMessage(obj, reply, message);
            }
            return;
        }

        console.log('Running triggers on', message.text);

        const command = await Message.findTrigger(obj, message);
        if (command) {
            const reply = await command.reply(message, obj);
            if (reply) return Message.sendMessage(obj, reply, message);
        }

        return false;
    }

    public static splitTrigger(text: string): string[] {
        const split = text.split(' ');
        const trigger = split.shift() || '';
        const action = split.shift() || '';
        const params = split;
        return [text, trigger, action, ...params];
    }

    public static installObj(install: IInstall) {
        const store = _.get(install, 'store', null);
        const rtm = _.get(install, 'rtm', null);
        const botId = _.get(install, 'store.botId', null);
        const teamId = _.get(install, 'store.teamId', null);
        if (!install || !store || !rtm || !botId || !teamId) {
            throw new Error('invalid install');
        }
        return {install, store, botId, teamId};
    }

}
