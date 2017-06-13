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

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/intercom-to-mongodb.svg
[travis_url]: https://travis-ci.org/mongodb-js/intercom-to-mongodb
[npm_img]: https://img.shields.io/npm/v/intercom-to-mongodb.svg
[npm_url]: https://npmjs.org/package/intercom-to-mongodb
