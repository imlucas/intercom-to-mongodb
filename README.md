# intercom-to-mongodb [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Import all data from an Intercom app into a MongoDB deployment

## Install

```bash
npm install -g intercom-to-mongodb
```


## CLI

Create a `.env` file:

```
INTERCOM_API_KEY=<YOUR_INTERCOM_API_KEY>
INTERCOM_APP_ID=<YOUR_INTERCOM_API_KEY>
MONGODB_URL=<YOUR_MONGODB_URL>
```


```bash
> intercom-to-mongodb --help
Usage: intercom-to-mongodb [options] [command]


Commands:

  users           import all user data
  tags            import data for all tags
  segments        import data for all segments
  conversations   import data for all conversations
  admins          import data for all admins
  events          import all event data

Options:

  -h, --help              output usage information
  -V, --version           output the version number
```

### Import all users


```bash
# Also imports all tags, segments, conversations, admins.
DEBUG=* intercom-to-mongodb users;
```

### Import all events


```bash
# Must have users imported first.  Have to iterate through user ids and
# fetch event streams individually.  Takes a really long time. Just hit
# ctrl+c to kill it when you have enough data.
DEBUG=* intercom-to-mongodb events;
```


If you used `mongodb://localhost:27017/intercom` as `MONGODB_URL` in your `.env` file:


```bash
> mongo 'mongodb://localhost:27017/intercom'
show collections
admins
conversations
events
segments
tags
users
```

## Todo

- [x] Initial get of 10k users [from Intercom API](https://developers.intercom.com/v2.0/reference#users)
- [x] Initial get of all admins [from Intercom API](https://developers.intercom.com/v2.0/reference#admins)
- [x] Initial get of all tags [from Intercom API](https://developers.intercom.com/v2.0/reference#tags)
- [x] Initial get of all segments [from Intercom API](https://developers.intercom.com/v2.0/reference#segments)
- [x] Initial get of all conversations [from Intercom API](https://developers.intercom.com/v2.0/reference#conversations)
- [x] Use the [Scroll API](https://developers.intercom.com/v2.0/reference#iterating-over-all-users) to get all users
- [x] Reshape user location shape and `db.users.createIndex( { "coordinates": "2dsphere" } )`
- [x] Cast user `*_at` epoch time fields from Intercom API as `ISODate`
- [x] `$lookup` to inline `user.tags` from `tags.name`
- [x] `$lookup` to inline `user.segments` from `tags.segments`
- [x] Get all events for all users
- [ ] Support incremental resync from Intercom API
- [ ] For each conversation, get the full conversation from API which has `conversations_parts` populated. Once completed, the `conversation` document will be interesting, metadata alone
- [ ] Sentiment analysis on `conversations_parts` contents, e.g. https://github.com/wooorm/retext-sentiment

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/intercom-to-mongodb.svg
[travis_url]: https://travis-ci.org/mongodb-js/intercom-to-mongodb
[npm_img]: https://img.shields.io/npm/v/intercom-to-mongodb.svg
[npm_url]: https://npmjs.org/package/intercom-to-mongodb
