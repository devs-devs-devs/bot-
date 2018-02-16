/*

    Daemon manages the hoisting and unhoisting of Slack instances

    Basically orchestrates connection and disconnection from RTM instances

 */

import Data from './Data';
import Logger from './Logger';
import { Pool } from 'mysql2/promise';
import IInstall, { IBot3AppData, ISlackChannel, TRTMClient } from '../interfaces/slack';
import { RtmClient, WebClient, CLIENT_EVENTS, RTM_EVENTS } from '@slack/client';
import RowDataPacket = require('mysql/lib/protocol/packets/RowDataPacket');

class Daemon {

    private pool: Pool;
    private installs: Map<string, IInstall> = new Map();

    public async init() {
        this.pool = await Data.getPool();
        await this.fetchInstalls();
    }

    private async fetchInstalls() {

        const [installs] = await this.pool.query<IInstall[]>('SELECT * FROM `installs`');
        installs.forEach(install => {
            if (!this.installs.get(install.team)) {
                install.rtm = null;
                this.installs.set(install.team, install);
                this.connectInstall(install.team);
            }
        });

    }

    private async connectInstall(teamId: string) {
        const install = this.installs.get(teamId);
        if (!install) {
            Logger.error(`${teamId} returns no instance of install`);
            this.installs.delete(teamId);
            return;
        }
        install.store = {};
        install.web = new WebClient(install.bot_oauth);
        install.rtm = new RtmClient(install.bot_oauth, {
            dataStore: install.store,
            useRtmConnect: true
        });

        this.bindEvents(install);
    }

    private bindEvents(install: IInstall) {

        if (!install) return Logger.error('No install passed into bindEvents');
        if (!install.store) install.store = {};

        const { rtm, web, store } = install;

        rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, async (connectData: any) => {

            const { domain, name } = connectData.team;
            const blob = JSON.stringify(connectData);

            await this.pool.query('UPDATE `installs` SET domain = ?, name = ?, json = ?', [domain, name, blob]);

            store.botId = connectData.self.id;
            store.teamId = connectData.team.id;

            await this.getChannels(store.teamId);
        });

        rtm.on(RTM_EVENTS.MESSAGE, (message: any) => {
            if ( (message.subtype && message.subtype === 'bot_message') ||
                (!message.subtype && message.user === store.botId) ) {
                return;
            }

            // DO BOTT STUFF HERE

        });

        rtm.start();

    }

    private async getChannels(teamId: string) {
        Logger.info(`Getting channels for: ${teamId}`);
        const { web, store } = this.installs.get(teamId);
        const channelObj = await web.channels.list();
        store.channels = channelObj.channels;
        await this.persistChannels(teamId);
        return store.channels;
    }

    private async persistChannels(teamId: string) {
        Logger.info(`Persisting channels for: ${teamId}`);
        const { channels } = this.installs.get(teamId).store;
        const channelQueries = channels.map( (channel: ISlackChannel) => {
            Logger.info(`Updating channel: ${channel.id} @ ${teamId}`);
            const blob = JSON.stringify(channel);
            return this.pool.query('INSERT INTO channels (id, team, json) VALUES (?,?,?) ON DUPLICATE KEY UPDATE json = ?', [channel.id, teamId, blob, blob]);
        });
        await Promise.all(channelQueries);
        Logger.info(`Updated all channels for: ${teamId}`);
    }

}

export default new Daemon();
