/*

    Daemon manages the hoisting and unhoisting of Slack instances

    Basically orchestrates connection and disconnection from RTM instances

 */

import * as _ from 'lodash';
import BotData from './Data';
import Logger from './Logger';
import { Pool } from 'mysql2/promise';
import { IBotSlackChannel, ISlackEvent } from '../interfaces/slack';
import { CLIENT_EVENTS, RTM_EVENTS, RtmClient, WebClient } from '@slack/client';
import IInstall from '../interfaces/iinstall';
import Message from '../slack-types/Message';

class Daemon {

    private pool: Pool = BotData.getPool();
    private installs: Map<string, IInstall> = new Map();
    private channels: Map<string, any> = new Map();
    private members: Map<string, any> = new Map();

    public init() {
        this.fetchInstalls();
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
        if (!install.store) {
            install.store = {
                teamId:'',
                botId:'',
                channels:[]
            };
        }

        const { rtm, store } = install;

        rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, async (connectData: any) => {
            const { domain, name } = connectData.team;
            const blob = JSON.stringify(connectData);

            await this.pool.query('UPDATE `installs` SET domain = ?, name = ?, json = ?', [domain, name, blob]);

            store.botId = connectData.self.id;
            store.teamId = connectData.team.id;

            if (store.teamId) {
                const { teamId } = store;
                await this.requestChannels(teamId);
                await this.requestMembers(teamId);
                rtm.on(RTM_EVENTS.MESSAGE, (event: ISlackEvent) => Message.in(install, event));
            }

        });

        rtm.start();
    }

    private async requestChannels(teamId: string) {

        Logger.info(`Getting channels for: ${teamId}`);

        const install = this.installs.get(teamId);
        if (!install) return Logger.error('No install exists for team', teamId);

        const { web } = install;

        const channelObj: {channels:IBotSlackChannel[]} = await web.channels.list();

        channelObj.channels.forEach((channel) => {
            channel.teamId = teamId;
            this.channels.set(channel.id, channel);
        });

        this.persistChannels();

    }

    private async requestMembers(teamId: string) {
        Logger.info(`Getting members for: ${teamId}`);

        const install = this.installs.get(teamId);
        if (!install) return Logger.error('No install exists for team', teamId);

        const { web } = install;
        const membersObj = await web.users.list();

        membersObj.members.forEach((member: any) => {
            this.members.set(member.id, member);
        });

        this.persistMembers();

    }

    private async persistMembers() {
        Logger.info(`Persisting members`);

        const membersArr = Array.from(this.members);

        await Promise.all(membersArr.map(async ([memberId, member]: [string, any]) => {
            const profile = JSON.stringify(member.profile);
            const { id, team_id, name, deleted, is_bot, updated, is_app_user } = member;
            await this.pool.query(`INSERT INTO members (id, team_id, name, deleted, profile, is_bot, updated, is_app_user)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, deleted = ?, profile = ?, updated = ?`, [id, team_id, name, deleted, profile, is_bot, updated, is_app_user, name, deleted, profile, updated]);
        }))
    }

    private async persistChannels() {
        Logger.info(`Persisting channels`);

        const channelsArr = Array.from(this.channels);

        await Promise.all(channelsArr.map(async ([channelId,channel]: [string, IBotSlackChannel]) => {
            const teamId = channel.teamId;
            const blob = JSON.stringify(channel);
            await this.pool.query('INSERT INTO channels (id, team, json) VALUES (?,?,?) ON DUPLICATE KEY UPDATE json = ?', [channel.id, teamId, blob, blob]);
        }));
    }

}

export default new Daemon();
