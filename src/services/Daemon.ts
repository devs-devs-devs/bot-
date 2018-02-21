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
import Presence from '../slack-types/Presence';
import Members from '../slack-types/Members';

class Daemon {

    private pool: Pool = BotData.getPool();
    private installs: Map<string, IInstall> = new Map();

    public init() {
        this.fetchInstalls();
    }

    public getInstall(teamId: string) {
        return this.installs.get(teamId);
    }

    private async fetchInstalls() {

        const [installs] = await this.pool.query<IInstall[]>('SELECT * FROM `installs`');
        installs.forEach(install => {
            Logger.info(`Connecting install ${install.team}`);
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
        install.store = {
            members: new Map(),
            channels: new Map()
        };
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
            const { domain, name, id } = connectData.team;
            const blob = JSON.stringify(connectData);
            await this.pool.query('UPDATE `installs` SET `domain` = ?, `name` = ?, `json` = ? WHERE `team` = ?', [domain, name, blob, id]);

            store.botId = connectData.self.id;
            store.teamId = connectData.team.id;

            if (store.teamId) {
                const { teamId } = store;
                await this.requestChannels(teamId);
                await this.requestMembers(teamId);
                rtm.on(RTM_EVENTS.MESSAGE, (event: ISlackEvent) => {
                    Logger.info(teamId, event);
                    Message.in(install, event);
                });

                function presenceChange(event: ISlackEvent): void {
                    // Logger.info(teamId, event);
                    // Presence.in(install, event);
                }
                //
                // console.log(RTM_EVENTS);
                //
                rtm.on(RTM_EVENTS.PRESENCE_CHANGE, (event: ISlackEvent) => {
                    Logger.info(teamId, event);
                    Presence.in(install, event);
                });

                const timecards = Array.from(store.members.keys());
                if (timecards.length) {
                    rtm.subscribePresence(timecards);
                }

                rtm.on(RTM_EVENTS.DND_UPDATED, presenceChange);
                rtm.on(RTM_EVENTS.DND_UPDATED_USER, presenceChange);
                rtm.on(RTM_EVENTS.MANUAL_PRESENCE_CHANGE, presenceChange);
                rtm.on(RTM_EVENTS.MEMBER_JOINED_CHANNEL, Members.in);
            }

        });

        rtm.start({
            batch_presence_aware: true,
        });
    }

    private async requestChannels(teamId: string) {

        Logger.info(`Getting channels for: ${teamId}`);

        const install = this.installs.get(teamId);
        if (!install) return Logger.error('No install exists for team', teamId);

        const { web, store } = install;

        const channelObj: {channels:IBotSlackChannel[]} = await web.channels.list();

        channelObj.channels.forEach((channel) => {
            channel.teamId = teamId;
            if (store) store.channels.set(channel.id, channel);
        });

        this.persistChannels();

    }

    private async requestMembers(teamId: string) {
        Logger.info(`Getting members for: ${teamId}`);

        const install = this.installs.get(teamId);
        if (!install) return Logger.error('No install exists for team', teamId);

        const { web, store } = install;
        const membersObj = await web.users.list();

        membersObj.members.forEach((member: any) => {
            if (store) store.members.set(member.id, member);
        });

        this.persistMembers();

    }

    private async persistMembers() {
        Logger.info(`Persisting members`);

        this.installs.forEach(async (install: IInstall) => {
            const { store } = install;
            if (!store) return;
            const membersArr = Array.from(store.members) as any;

            await Promise.all(membersArr.map(async ([memberId, member]: [string, any]) => {
                const profile = JSON.stringify(member.profile);
                const { id, team_id, name, deleted, is_bot, updated, is_app_user } = member;
                await this.pool.query(`INSERT INTO members (id, team_id, name, deleted, profile, is_bot, updated, is_app_user)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, deleted = ?, profile = ?, updated = ?`, [id, team_id, name, deleted, profile, is_bot, updated, is_app_user, name, deleted, profile, updated]);
            }));
        });
    }

    private async persistChannels() {
        Logger.info(`Persisting channels`);

        this.installs.forEach(async (install: IInstall) => {
            const {store} = install;
            if (!store) return;
            const channelsArr = Array.from(store.channels) as any;

            await Promise.all(channelsArr.map(async ([channelId, channel]: [string, IBotSlackChannel]) => {
                const teamId = channel.teamId;
                const blob = JSON.stringify(channel);
                await this.pool.query('INSERT INTO channels (id, team, json) VALUES (?,?,?) ON DUPLICATE KEY UPDATE json = ?', [channel.id, teamId, blob, blob]);
            }));

        });

    }

}

export default new Daemon();
