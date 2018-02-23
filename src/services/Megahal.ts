import Daemon from './Daemon';
import BotData from './Data';
import Logger from './Logger';
import { Pool } from 'mysql2/promise';
import IInstall from '../interfaces/iinstall';

const jsmegahal = require('jsmegahal');

class Megahal {

    private megahals: any = {};
    private pool: Pool = BotData.getPool();

    constructor() {
    }

    async init(installs: any) {
        let promises: any = [];
        installs.forEach((install: IInstall) => {
            promises.push(Promise.resolve().then(async () => {
                const { team } = install;
                this.megahals[team] = new jsmegahal(4);
                const [rows] = await this.pool.query("SELECT * FROM `events` WHERE `team` = ? AND `type`='message' AND edited = 0", [team]) as any;
                rows.forEach((row: any) => {
                    this.add(team, row.text.toString());
                });
            }))
        });
        return Promise.all(promises);
    }

    add(team: string, text:string) {
        this.megahals[team].add(text);
    }

    async get(team:string, text:string = '') {
        const reply = this.megahals[team].getReply(text);
        console.log('@REPLY', reply);
        return await reply;
    }

}

export default new Megahal();
