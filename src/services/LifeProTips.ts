import reddit from './Reddit';
import daemon from './Daemon';
import IInstall from '../interfaces/iinstall';
import Message from '../slack-types/Message';

const personalisedReplies = [
    {
        subreddit:'ShittyLifeProTips',
        teamId:'T5T1MHSQL',
        channel:'C5T25GFTN',
        user:'U5SV39UP5'
    },
    {
        subreddit:'Pyongyang',
        teamId:'T5T1MHSQL',
        channel:'C5T25GFTN',
        user:'U5TR3SLKH'
    },
    {
        subreddit:'FedoraFederation',
        teamId:'T5T1MHSQL',
        channel:'C5T25GFTN',
        user:'U5SESGTME'
    }
];

export default class LifeProTips {

    constructor() {

        personalisedReplies.forEach((reply:any) => {

            const install = daemon.getInstall(reply.teamId);
            if (!install) return;

            const obj = Message.installObj(install);
            const { channel, user } = reply;
            reddit.addPostWatcher(reply.subreddit)
                .on('post', (comment: any) => {
                    const msg = `<@${user}> ${comment.data.title} ${comment.data.url}`;
                    Message.sendMessage(obj, msg, { channel });
                });

        });

    }

}
