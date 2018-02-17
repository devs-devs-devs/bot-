import { Application, Request, Response } from 'express';
import * as crypto from 'crypto';
import Logger from'./Logger';

const { GITHUB_SECRET } = process.env;

export default class GitHubWebHook {

    constructor(app: Application) {
        Logger.info('Github Web Hooks online');
        app.post('/github', this.parsePayload.bind(this));
    }

    parsePayload(req: Request, res: Response) {

        if (!GITHUB_SECRET) {
            throw Logger.error(`Cannot process payload'`);
        }

        const payload = JSON.stringify(req.body);
        const signature = req.get('x-hub-signature') || '';
        const computedSignature = `sha1=${crypto.createHmac("sha1", GITHUB_SECRET)
            .update(payload)
            .digest("hex")}`;

        const secureHook = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));

        if (!secureHook) {
            return res.status(401).send('Unsecure');
        }

        res.status(200).send('OK');

        // TODO: Report through all installs and set report chan
        // const gitmsg = {
        //     channel:REPORT_CHANNEL,
        //     text:`New code detected for <@U87U6ES12>. Please wait while we start ${shuffle(jargon)[0].toLowerCase()}...`,
        //     attachments:JSON.stringify((req.body.commits||[]).map((commit: any) => {
        //         return {
        //             title: commit.message,
        //             title_link: commit.url,
        //             text:`Commit by: ${commit.author.name} <${commit.author.username}>`
        //         }
        //     }), null, 4)
        // };

        //Logger.log(this.serviceName, gitmsg);

        //Reply(gitmsg);

        this.triggerReload();

    }

    triggerReload() {

        setTimeout(() => {
            [
                'git pull',
                'npm run build',
                'cp .env dist/',
                './node_modules/.bin/forever restartall'
            ].forEach(cmd => {
                require('child_process').execSync(`cd ${__dirname} && ${cmd}`);
            });
        }, 2500);
    }

}
