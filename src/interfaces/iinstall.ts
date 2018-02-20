import { TRTMClient, TWebClient } from './slack';
import IBot3AppData from './ibot3appdata';

export default interface IInstall {
    id: number;
    team: string;
    oauth: string;
    bot_oauth: string;
    web?: null | TWebClient;
    rtm?: null | TRTMClient;
    store?: IBot3AppData;
}
