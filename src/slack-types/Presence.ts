import IInstall from '../interfaces/iinstall';
import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';
import Message from './Message';

const pool: Pool = BotData.getPool();

export default class Presence {

    public static async in(install: IInstall, event: any) {
        const obj = Message.installObj(install);
        const ts = +new Date() / 1000;
        const { type, user } = event;
        const team = obj.teamId;
        const text = event.presence || event.dnd_status.dnd_enabled;
        const channel = '';
        const thumb = Message.thumb(ts,'',user,obj.teamId);

        await pool.query('INSERT INTO `events` SET ? ', {thumb, ts, type, channel, user, text, team });

    }

}
