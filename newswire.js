const genres = {
    latest: 'https://www.rockstargames.com/newswire/get-posts.json?page=1',
    rdr2: 'https://www.rockstargames.com/newswire/tags.json?tags=716&page=1',
    gtav: 'https://www.rockstargames.com/newswire/tags.json?tags=702&page=1'
};
const newsDir = './newswire.json';
const request = require('got');
const refreshInterval = 7.2e+6; // 2 hours
const fs = require('fs');
let articles;

fs.readFile(newsDir, 'utf8', (err, jsonString) => {
    articles = jsonString ? JSON.parse(jsonString) : {};
});


class newswire {
    constructor(genre, webhook) {
        if (!genres[genre]) return console.log('Invalid genre. Valid genres: (latest, rdr2, gtav)');
        this.genre = genre;
        this.genreFeed = genres[genre];
        this.webhook = webhook;
        this.main();
    }

    async main() {
        console.log('[READY] Started news feed for ' + this.genre + '. Feed refreshes every 2 hours.');
        let article = await this.getNewArticle();
        if (article) this.sendArticle(article);
        setInterval(async _ => {
            console.log('[REFRESH] Refreshing news feed for ' + this.genre);
            let article = await this.getNewArticle();
            article && article.title ? this.sendArticle(article) : console.log('[ERROR] Failed to retrieve article for ' + this.genre);
        }, refreshInterval);
    }

    sendArticle(article) {
        article.title = sanitfy(article.title);
        article.content = sanitfy(article.content);
        let tags = '' + article.tags.map(tag => '`' + tag + '` ');
        console.log(`[NEW] ${this.genre}: ${article.title} (${article.link})`);
        const embed = {
            'embeds': [{
                'author': {
                    'name': 'Newswire',
                    'url': 'https://www.rockstargames.com/newswire',
                    'icon_url': 'https://img.icons8.com/color/48/000000/rockstar-games.png'
                },
                'title': article.title,
                'url': article.link,
                'description': tags,
                'color': 15258703,
                'fields': [{
                    'name': 'Summary',
                    'value': article.content,
                    'inline': false
                }],
                'image': {
                    'url': article.img
                }
            }]
        };
        request.post(webhook, {
            body: JSON.stringify(embed),
            headers: {
                'content-type': 'application/json'
            }
        });
    }

    async getNewArticle() {
        console.log('[CHECK] Checking for new articles for ' + this.genre);
        return this.processRequest().then(async (res) => {
            let article = res.posts[0];
            let check = checkArticleExists(article.id.toString());
            if (!check) {
                let tags = [];
                await article.primary_tags.map(tag => tags.push(tag.name))
                addArticle(article.id.toString(), article.link);
                return {
                    title: article.title,
                    content: article.blurb_short,
                    link: article.link,
                    img: article['preview_images_parsed'].large.src,
                    tags: tags
                }
            } else {
                console.log('[CHECK] No new articles found for ' + this.genre)
                return false;
            }
        }).catch(console.log);
    }

    processRequest() {
        return new Promise(async (resolve, reject) => {
            const response = await request(this.genreFeed).catch(reject);
            resolve(JSON.parse(response.body));
        });
    }
}

function sanitfy(text) {
    text = text
        .replace('<span class=\'subtitle\'>', '(')
        .replace('</span>', ')')
        .replace(/<\/?strong[^>]*>/g, '**')
        .replace(/<\s*a[^>]*>(.*?)<\s*\/s*a>/i, '')
        .replace('&amp;', '\'')
    return text;
}

function addArticle(article, url) {
    if (articles) {
        if (!articles[article]) {
            articles[article] = url;
            fs.writeFile(newsDir, JSON.stringify(articles, null, 2), (err) => {
                if (err) console.log('Failed to save articles to db due ' + err);
            });
        } else {
            console.log('Article ID: ' + article + ' already exists in database.');
        }
    }
}

function checkArticleExists(articleID) {
    return (articles && articles[articleID]);
}

module.exports = newswire;
