import BotData from '../services/Data';
import { Pool } from 'mysql2/promise';
import Command from './Command';
import Message from '../slack-types/Message';
import Daemon from '../services/Daemon';

export default class Copypasta extends Command {

    private pool: Pool = BotData.getPool();

    constructor() {
        super('Copypasta', ['cp']);
        this.init();
    }

    async init() {
        // Do nothing
    }

    async reply(message: any, obj: any) {
        const { action, params } = this.parseText(message.text);
        const actions = ['add'];

        if (actions.indexOf(action) !== -1) {
            if (action === 'add') return await this.addAction(message, params, obj);
            //if (action === 'delete') return this.deleteAction(params, event);
        }
        return await this.randomAction(message, obj);
    }

    async addAction(message: any, params: string, obj: any) {
        if (!params) return;
        const insertResult = await this.pool.query('INSERT INTO `copypasta` (`copypasta`, `user`, `team`) VALUES(?, ?, ?)', [params, message.user, obj.teamId]);
        if (insertResult.length) {
            return `Added copypasta \`${(insertResult[0] as any).insertId}\` by <@${message.user}>!`
        } else {
            return `Could not complete that request ffs`;
        }
    }

    async randomAction(message: any, obj: any) {
        const [data] = await this.pool.query('SELECT `copypasta`, `user`, `team`, r1.id FROM `copypasta` AS r1 JOIN (SELECT CEIL(RAND() * (SELECT MAX(id) FROM `copypasta`)) AS id) AS r2 WHERE r1.id >= r2.id ORDER BY r1.id ASC LIMIT 1') as any;
        const copypasta = data[0];
        let username = `COPYPASTA #${copypasta.id}`;
        const [users] = await this.pool.query('SELECT * FROM `members` WHERE id = ?', copypasta.user) as any;
        if (users.length) {
            let user = users[0];
            if (user.team_id === obj.teamId) {
                username += ` - added by <@${user.id}>`;
            } else {
                username += ` - added by ${user.name}`;
            }
        }

        return {
            id: +new Date(),
            type:'message',
            channel:message.channel,
            text:copypasta.copypasta.toString()+`\n\n_${username}_`
        };
    }

}
