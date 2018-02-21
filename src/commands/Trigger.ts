import Command from './Command';
import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';
import Logger from '../services/Logger';
import _ = require('lodash');

export default class Trigger extends Command {

    private triggerChanceToSpeak: number = 95;
    private triggerReplyInterval: number = 1000 * 60 * 10;

    private pool: Pool = BotData.getPool();

    constructor() {
        super('trigger', ['t', 'trigger']);
        this.init();
    }

    async init() {
        // nada
    }

    async reply(message: any, obj: any) {

        const { action, params } = this.parseText(message.text);

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
        const { user } = message;
        const team = obj.teamId;
        if (!trigger || !phrase || !user) return '';

        const insert = await this.pool.query('INSERT INTO `triggers` SET ?', { trigger, phrase, user, team }) as any;

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

        const { store } = obj.install;

        const lastSpoke = +new Date() - store.lastTrigger;
        const dice = Math.floor(Math.random() * 100) + 1;

        const doReply = lastSpoke > this.triggerReplyInterval || dice >= this.triggerChanceToSpeak;

        Logger.info(this.name, `Roll ${dice} / 100`, `Time: ${lastSpoke}`, `Reply? ${doReply}`);
        Logger.info(obj.teamId, message.user, message.text);

        if (!doReply) return '';

        const [data] = await this.pool.query('SELECT `trigger` FROM `triggers` WHERE team = ? GROUP BY `trigger`', [obj.teamId]) as any;
        const keywords = data.map((row:any) => row.trigger);

        const text = message.text.toLowerCase();
        const triggers = _.shuffle(text.split(' '));

        while (triggers.length) {
            const trigger = triggers.pop();

            if (trigger && keywords.indexOf(trigger) !== -1) {

                const [responses] = await this.pool.query('SELECT `phrase` FROM `triggers` WHERE `trigger` = ? AND team = ?', [trigger, obj.teamId]) as any;
                const phrases = responses.map((row:any) => row.phrase);

                const phrase = _.shuffle(phrases)[0].toString();

                if (!phrase) return 'no phrase';
                store.lastTrigger = +new Date();
                return phrase;

            }

            return '';
        }

    }

}
