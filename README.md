# rockstar-newswire
Bring Rockstar [newswire](https://www.rockstargames.com/newswire) feed to your discord server.

## Install
- Install the required Node packages via `npm i` or `yarn install`

## API

```js
    let newswire = require('./newswire');
    let latestNews = new newswire(type, webhookURL);
    // Available Types: rdr2, gtav, latest, music, fanart, fanvideos, creator, tips, rockstar, updates,
    // Webhook URL: https://support.discordapp.com/hc/en-us/articles/228383668-Intro-to-Webhooks
    // News should automatically post and update every 2 hours.
```
### Available types
- `creator` (Creator jobs articles featured by Rockstar)
- `fanart` (General fans' art articles from any Rockstar game)
- `fanvideos` (General fans' showoff videos articles from any Rockstar game)
- `gtav` (GTA V general news)
- `music` (Music production articles)
- `latest` (Latest news from any type that shows on newswire homepage)
- `rdr2` (Red dead redemption 2 general news)
- `rockstar` (Rockstar company updates)
- `tips` (General game tips from Rockstar)
- `updates` (Any Released game updates)

## Notes
- You require discord [webhook URL](https://support.discordapp.com/hc/en-us/articles/228383668-Intro-to-Webhooks).
- Feed refreshes every 2 hours to make sure its up-to-date. If you would like to change it then you're required to change this [variable](https://github.com/Carbowix/rockstar-newswire/blob/master/newswire.js#L18) using that time [converter](http://www.unitconversion.org/time/seconds-to-milliseconds-conversion.html). It has to be in **milliseconds** in order to operate properly.
- It's recommened to take `newsdb.json` with you if you're porting the project to another host to prevent redundant news posts.
- It is not guranteed that it can trace multiple new news posts of the same type since it only traces the last post posted. In-order to avoid such error, you can lower the news feed refresh rate as specified previously. If you have a idea on how to improve it then feel free to contribute.
- This is a small research project and it's not meant to be used as a network harm tool.
## Demo
![](./demo.png "Example of news feed.")

## Credits
- Rockstar [newswire](https://www.rockstargames.com/newswire).
- [got](https://www.npmjs.com/package/got) for lightweight simple https requests.
- [puppeteer](https://www.npmjs.com/package/puppeteer) for their virtual browser network tracing.
