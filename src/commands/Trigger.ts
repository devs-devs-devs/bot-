import Command from './Command';
import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';
import Logger from '../services/Logger';
import _ = require('lodash');
import Message from '../slack-types/Message';
import Daemon from '../services/Daemon';

export default class Trigger extends Command {

    private pool: Pool = BotData.getPool();
    private currentlyShitposting: boolean = false;
    private triggerReplyInterval: number = 1000 * 60 * 10;

    private async broadcastShitpost(enabled: boolean) {
        const [channels] = await this.pool.query('SELECT `id`, `team` FROM `channels`') as any;
        channels.forEach((channel: any) => {
            const install = Daemon.getInstall(channel.team);
            if (!install) return;
            const obj = Message.installObj(install);
            obj.install.rtm.sendMessage(
                (enabled) ?
                    ':shitposting: shitposting has begun. happy friday xxx :shitposting:' :
                    'Shitposting has ended. Time to send the dealer a text!',
                channel.id
            );
        })
    }

    private get triggerChanceToSpeak() {
        // These are the inverse of 100, 95 = 5%, 20 = 80%
        const chanceToSpeak = 95;
        const shitpostFriday = 20;

        // subtract one because javascript dates 0-23
        const startTimeHours = 9 - 1;
        const endTimeHours = 18 - 1;
        const hectorsOffset = -3; // hours

        const now = new Date(+new Date + (hectorsOffset * 3600 * 1000));
        const currentHour = now.getHours();

        // Has to be friday
        if (now.getDay() !== 4) return chanceToSpeak;

        if (currentHour >= startTimeHours && currentHour <= endTimeHours) {
            if (!this.currentlyShitposting) {
                this.currentlyShitposting = true;
                this.broadcastShitpost(true);
            }
            return shitpostFriday;
        }

        if (this.currentlyShitposting) {
            this.currentlyShitposting = false;
            this.broadcastShitpost(false);
        }
        return chanceToSpeak;

    }

    constructor() {
        super('trigger', ['t', 'trigger']);
        this.init();
    }

    async init() {
        // nada
    }

    async reply(message: any, obj: any) {

        const {action, params} = this.parseText(message.text);

        const actions = ['add']; //'delete'];

        if (actions.indexOf(action) !== -1) {
            if (action === 'add') return await this.addAction(message, params, obj);
            //if (action === 'delete') return this.deleteAction(params, message, obj);
        }

        return await this.scan(message, obj);

    }

    async addAction(message: any, params: any, obj: any) {
        const trigger = params.split(' ', 1)[0];
        const phrase = params.substr(trigger.length).trim();
        const {user} = message;
        const team = obj.teamId;
        if (!trigger || !phrase || !user) return '';

        const insert = await this.pool.query('INSERT INTO `triggers` SET ?', {trigger, phrase, user, team}) as any;

        if (insert.length) {
            return `Added "${phrase}" as a response to *${trigger}?*`;
        } else {
            return '';
        }
    }

    async scan(message: any, obj: any) {

        if (!_.get(obj, 'install.store.lastTrigger', false)) {
            obj.install.store.lastTrigger = 0;
        }

        // const [chanceToSpeak] = await this.pool.query('SELECT `chancetospeak` FROM `installs` WHERE `team` = ?', [obj.teamId]) as any;
        // this.triggerChanceToSpeak = 100 - chanceToSpeak[0];

        const {store} = obj.install;

        const lastSpoke = +new Date() - store.lastTrigger;
        const dice = Math.floor(Math.random() * 100) + 1;

        const doReply = lastSpoke > this.triggerReplyInterval || dice >= this.triggerChanceToSpeak;

        Logger.info(this.name, `Roll ${dice} / 100`, `Time: ${lastSpoke}`, `Reply? ${doReply}`);
        Logger.info(obj.teamId, message.user, message.text);

        if (!doReply) return '';

        const [data] = await this.pool.query('SELECT `trigger` FROM `triggers` WHERE team = ? GROUP BY `trigger`', [obj.teamId]) as any;
        const keywords = data.map((row: any) => row.trigger);

        const text = message.text.toLowerCase();
        const triggers = _.shuffle(text.split(' '));

        console.log('Triggers', triggers);

        while (triggers.length) {
            const trigger = triggers.pop();

            if (trigger && keywords.indexOf(trigger) !== -1) {

                const [responses] = await this.pool.query('SELECT `phrase` FROM `triggers` WHERE `trigger` = ? AND team = ?', [trigger, obj.teamId]) as any;
                const phrases = responses.map((row: any) => row.phrase);

                const phrase = _.shuffle(phrases)[0].toString();

                if (!phrase) return 'no phrase';
                store.lastTrigger = +new Date();
                return phrase;

            }
        }
        return '';

    }

}
