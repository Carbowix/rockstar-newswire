const webhook = 'webHookURL';
const news = 'https://www.rockstargames.com/newswire/tags.json?tags=702&page=1';
const request = require('got');
const level = require('level');
const refreshInterval = 7.2e+6; // 2 hours
let db = level('newswire');

async function getNewArticle() {
    return processRequest().then(async (res) => {
        let article = res.posts[0];
        let check = await checkArticleExists(article.id.toString());
        if (!check) {
            let tags = [];
            await article.primary_tags.map(tag => tags.push(tag.name))
            await addArticle(article.id.toString(), article.link);
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
    }).catch(console.log)
}

async function addArticle(article, url) {
    let state = true;
    await db.put(article, url, function (err) {
        if (err) {
            console.log(`[DB ERROR] ${err}`)
            state = false;
        }
    });
    return state;
}

async function checkArticleExists(article) {
    let state = false;
    await db.get(article, function (err, value) {
        if (err) {
            console.log(`[DB ERROR] ${err}`);
            state = false;
        } else {
            console.log(`${value}`);
            state = true;
        }
    });
    return state;
}

async function sanitfy(text) {
    text = text
        .replace('<span class="subtitle"> ', '(')
        .replace('</span>', ')')
        .replace(/<\/?strong[^>]*>/g, '**')
        .replace(/<\s*a[^>]*>(.*?)<\s*\/s*a>/i, '')
        .replace('&amp;', "'")
    return text;
}

async function sendArticle(article) {
    article.title = await sanitfy(article.title);
    article.content = await sanitfy(article.content);
    let tags = '' + article.tags.map(tag => '`' + tag + '` ')
    const embed = {
        "embeds": [{
            "author": {
                "name": "Newswire",
                "url": "https://www.rockstargames.com/newswire",
                "icon_url": "https://img.icons8.com/color/48/000000/rockstar-games.png"
            },
            "title": article.title,
            "url": article.link,
            "description": tags,
            "color": 15258703,
            "fields": [{
                "name": 'Summary',
                "value": article.content,
                "inline": false
            }],
            "image": {
                "url": article.img
            },
            "footer": {
                "text": tags,
            }
        }]
    };
    await request.post(webhook, {
        body: JSON.stringify(embed),
        headers: {
            'content-type': "application/json"
        }
    })
}

function processRequest() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await request(news);
            resolve(JSON.parse(response.body));
        } catch (error) {
            reject(error)
        }
    })
}

const main = async () => {
    console.log('[READY] Started news feed');
    let article = await getNewArticle();
    if (article) sendArticle(article)
    setInterval(async _ => {
        let article = await getNewArticle();
        if (article) sendArticle(article);
    }, refreshInterval);
};

main();
