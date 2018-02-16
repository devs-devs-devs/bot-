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
