import IInstall from '../interfaces/iinstall';
import Message from './Message';
import { Pool } from 'mysql2/promise';
import BotData from '../services/Data';

const pool: Pool = BotData.getPool();

export default class Member {

    public static async in(install: IInstall, event: any) {

        const obj = Message.installObj(install);
        switch (event.subtype) {

            case 'channel_leave':
            case 'channel_join':
                return Member.join(obj, event);

        }

    }

    public static async join(obj: any, event: any) {
        const id = event.user;
        const team_id = event.team;
        const name = event.user_profile.name;
        const deleted = 0;
        const profile = JSON.stringify(event.user_profile);
        const is_bot = 0;
        const updated = +new Date() / 1000;
        const is_app_user = 0;
        const ts = event.ts;
        const channel = event.channel;
        const type = event.type;
        const subtype = event.subtype;
        const text = event.text;

        const members = {
            id,
            team_id,
            name,
            deleted,
            profile,
            is_bot,
            updated,
            is_app_user
        };

        const thumb = Message.thumb(ts,channel, id, team_id);

        const events = {
            thumb,
            ts,
            type,
            subtype,
            channel,
            user:id,
            text,
            team:team_id
        };

        await pool.query('INSERT INTO `members` SET ? ON DUPLICATE KEY UPDATE ?', [members, members]);
        await pool.query('INSERT INTO `events` SET ?', [events]);

    }

}
