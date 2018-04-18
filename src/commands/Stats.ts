import Command from './Command';
import Message from '../slack-types/Message';
import BotData from '../services/Data';
import { Pool } from 'mysql2/promise';
import * as ChartjsNode from 'chartjs-node';
import Daemon from '../services/Daemon';
import * as fs from 'fs';

export class Stats extends Command {

    private pool: Pool = BotData.getPool();

    constructor() {
        super('stats', ['stats']);
        this.init();
    }

    async init() {
        // Does nothing
    }

    async reply(message: any, obj: any) {

        const {channel} = message;

        let [text, trigger, user, ...params] = Message.splitTrigger(message.text);

        if (!user) {
            user = message.user;
        }

        if (!user.match(/<@(\w{9})>/gi)) {
            return 'No user';
        }

        const cleanedUser = user.replace(/(<|>|@)/gi, '');

        const [stats] = await this.pool.query(`SELECT
                FLOOR(ts/86400) as \`days\`,
                COUNT(*) as \`count\`
            FROM \`events\`
            WHERE \`user\` = ?
            AND \`channel\` = ?
            GROUP BY \`days\`
            ORDER BY \`days\` DESC
            LIMIT 30`, [cleanedUser, channel]) as any;

        const data: number[] = [];
        const labels: Date[] = [];

        stats.forEach((row: any) => {
            labels.push(new Date(row.days * 86400 * 1000));
            data.push(row.count);
        });

        const chartNode = new ChartjsNode(600, 600);

        const install = Daemon.getInstall(message.team);
        if (!install) return;
        const theObj = Message.installObj(install);

        const fileName = `./chart${message.ts}.png`;

        chartNode.drawChart({
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Last 30 days',
                    data: data,
                }],
            },
            options: {
                plugins:[],
            },
        })
            .then(() => chartNode.getImageBuffer('image/png'))
            .then((buffer: any) => {
                // console.log('tryna stunt on me innit');
                // theObj.install.web.files.upload({
                //     filename: +new Date(),
                //     file: buffer,
                // }).then(console.log.bind(console));
                return chartNode.getImageStream('image/png');
            })
            .then((streamResult: any) => {
                return chartNode.writeImageToFile('image/png', fileName);
            })
            .then(() => {
                chartNode.destroy();
                setTimeout(() => {
                    console.log('Uploading file');
                    // //obj.install.rtm.
                    theObj.install.web.files.upload({
                        channels: message.channel,
                        filename: fileName,
                        file: fs.createReadStream(fileName),
                        title: 'Mother fucker Jones',
                    }).then(console.log.bind(console));
                }, 3000);
            });

        console.log(stats);
        return `${stats}`;

    }

}
