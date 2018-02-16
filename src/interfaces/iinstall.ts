import { TRTMClient, TWebClient } from './slack';
import RowDataPacket = require('mysql/lib/protocol/packets/RowDataPacket');
import IBot3AppData from './ibot3appdata';

export default interface IInstall extends RowDataPacket {
    id: number;
    team: string;
    oauth: string;
    bot_oauth: string;
    web?: null | TWebClient;
    rtm?: null | TRTMClient;
    store?: IBot3AppData;
}
