import Command from './Command';
import Message from '../slack-types/Message';
import BotData from '../services/Data';
import { Pool } from 'mysql2/promise';

export class Wurd extends Command {

    private pool: Pool = BotData.getPool();

    constructor() {
        super('wurd', ['wurd']);
        this.init();
    }

    async init() {
        // Does nothing
    }

    async reply(message: any, obj: any) {

        const {channel} = message;

        const [stats] = await this.pool.query(`SELECT SUM(ROUND((CHAR_LENGTH(e.text) - CHAR_LENGTH(REPLACE (e.text, " ", ""))) / CHAR_LENGTH(" "))) AS \`count\`, m.name
            FROM \`events\` e
            LEFT JOIN \`members\` m ON e.user = m.id
            WHERE e.type = 'message'
                AND e.subtype IS NULL
                AND e.edited = 0
                AND e.channel = ?
            GROUP BY e.user
            ORDER BY \`count\` DESC
            LIMIT 15`, [channel]) as any;

        const largestNumber = (stats[0].count).toLocaleString('en-GB').length;

        const msg = stats.reduce((str: string, stat: any, index: number) => {
            const position = (`*${index + 1}*` as any).padStart(5);
            const count = (`${(stat.count).toLocaleString('en-GB')}` as any).padStart(largestNumber);
            return str += `${position}\t${count}\t${stat.name}\n`;
        }, '🥁 *( _word up_) > :gunfinger::male-technologist::skin-tone-6:* 🥁\n');

        console.log(msg);
        return `${msg}`;

    }

}
