import Command from './Command';
import Message from '../slack-types/Message';
import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';
import TimeAgo from 'javascript-time-ago';
require('javascript-time-ago/load-all-locales')

const timeAgo = new TimeAgo('en-GB');

export default class Seen extends Command {

    private pool: Pool = BotData.getPool();

    constructor() {
        super('Seen', ['seen']);
        this.init();
    }

    async init() {
        // Do nothing
    }

    async reply(message: any, obj: any) {

        const [ trigger, params ] = Message.splitTrigger(message.text);

        if (!params) return 'No params';

        const user = params.trim().split(' ')[0];

        if (!user.match(/<@(\w{9})>/gi)) {
            return 'No user';
        }

        const cleanedUser = user.replace(/(<|>|@)/gi, '');

        if (cleanedUser === message.user) return `I'm not a mirror m8`;

        const [ lastEvents ] = await this.pool.query('SELECT * FROM `events` WHERE user = ? AND team = ? ORDER BY id DESC LIMIT 1', [cleanedUser, obj.teamId]) as any;

        if (lastEvents.length) {

            const lastEvent = lastEvents[0];
            let activity = lastEvent.subtype || lastEvent.type;

            switch (activity) {
                case 'message_changed':
                case 'message':
                    activity = `writing ${lastEvent.text} in <#${lastEvent.channel}>`;
                    break;

                case 'channel_join':
                    activity = `joining <#${lastEvent.channel}`;
                    break;

                case 'channel_leave':
                    activity = `leaving <#${lastEvent.channel}`;
                    break;

                case 'presence_change':
                    activity = `marked as ${lastEvent.text}`;
                    break;
            }

            const when = timeAgo.format(new Date(lastEvent.ts * 1000));

            return `${user} was last seen ${activity} ${when}`;

        } else {
            return `I haven't seen ${user} recently`;
        }

    }

}
