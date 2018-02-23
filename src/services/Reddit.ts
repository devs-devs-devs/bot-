import * as Snooper from 'reddit-snooper';

const { REDDIT_SECRET, REDDIT_APP_ID, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;

class Reddit {

    private snooper: any;
    private snoops: any = {};

    constructor() {
        this.snooper = new Snooper({
            username:REDDIT_USERNAME,
            password:REDDIT_PASSWORD,
            app_id:REDDIT_APP_ID,
            api_secret:REDDIT_SECRET,
            automatic_retries: true,
            api_requests_per_minute: 60
        });
    }

    public addPostWatcher(subreddit: string) {
        this.snoops[subreddit] = this.snoops[subreddit] || this.snooper.getPostWatcher(subreddit);
        return this.snoops[subreddit];
    }

}

export default new Reddit();
