// TODO This is the Slack RTM Client
export type TRTMClient = any;

// TODO This is the Slack Web Client
export type TWebClient = any;

export interface IBotSlackChannel extends ISlackChannel {
    teamId: string;
}

export interface ISlackChannel {
    id: string;
    name: string;
    is_channel: boolean;
    created: number;
    is_archived: boolean;
    is_general: boolean;
    unlinked: number;
    creator: string;
    name_normalized: string;
    is_shared: boolean;
    is_org_shared: boolean;
    is_member: boolean;
    is_private: boolean;
    is_mpim: boolean;
    members: string[],
    topic:{
        value: string;
        creator: string;
        last_set: number;
    }
    purpose:{
        value:string;
        creator:string;
        last_set:number;
    }
    previous_names:any[],
    num_members:number
}

export interface ISlackEvent {
    type: string,
    username?: string,
    user?:string,
    text: string,
    ts?: string;
    channel: string;
    event_ts?: string;
    message?: any;
    subtype?: string;
    bot_id?: string;
}

export interface ISlackMessage {
    token: string;
    challenge?: string;
    team_id?: string;
    api_app_id?: string;
    event?: ISlackEvent;
    type?: string;
    event_id?: string;
    event_time?: number;
    authed_users?: string[];
}

export interface ISlackMember {
    id: string;
    team_id: string;
    name: string;
    deleted: boolean;
    color?: string;
    real_name: string;
    tz?: any;
    tz_label: string;
    tz_offset: number;
    profile: ISlackProfile;
    is_admin:boolean;
    is_owner:boolean;
    is_primary_owner:boolean;
    is_restricted:boolean;
    is_ultra_restricted:boolean;
    is_bot:false;
    updated:number;
    is_app_user:boolean;
}

export interface ISlackProfile {
    first_name:string;
    last_name:string;
    image_24:string;
    image_32:string;
    image_48:string;
    image_72:string;
    image_192:string;
    image_512:string;
    avatar_hash:string;
    always_active:boolean;
    display_name:string;
    real_name:string;
    real_name_normalized:string;
    display_name_normalized:string;
    fields:any;
    team:string;
}
