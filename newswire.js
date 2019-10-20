const webhook = 'webHook URL';
const news = 'https://www.rockstargames.com/newswire/tags.json?tags=702&page=1';
const request = require('got');
const level = require('level');
const refreshInterval = 7.2e+6; // 2 hours
let db = level('newswire');

async function getNewArticle() {
    console.log('[CHECK] Checking for new articles');
    return processRequest().then(async (res) => {
        let article = res.posts[0];
        let check = await checkArticleExists(article.id.toString());
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
            return false;
        }
    }).catch(console.log);
}

function addArticle(article, url) {
    return db.put(article, url);
}

function checkArticleExists(article) {
    return db.get(article);
}

async function sanitfy(text) {
    text = text
        .replace('<span class=\'subtitle\'>', '(')
        .replace('</span>', ')')
        .replace(/<\/?strong[^>]*>/g, '**')
        .replace(/<\s*a[^>]*>(.*?)<\s*\/s*a>/i, '')
        .replace('&amp;', '\'')
    return text;
}

async function sendArticle(article) {
    article.title = await sanitfy(article.title);
    article.content = await sanitfy(article.content);
    let tags = '' + article.tags.map(tag => '`' + tag + '` ');
    console.log(`[NEW] ${article.title} (${article.link})`);
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
    await request.post(webhook, {
        body: JSON.stringify(embed),
        headers: {
            'content-type': 'application/json'
        }
    });
}

function processRequest() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await request(news);
            resolve(JSON.parse(response.body));
        } catch (error) {
            reject(error);
        }
    })
}

const main = async () => {
    console.log('[READY] Started news feed');
    let article = await getNewArticle();
    if (article) sendArticle(article);
    setInterval(async _ => {
        let article = await getNewArticle();
        if (article) sendArticle(article);
    }, refreshInterval);
};

main();