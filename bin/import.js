#!/usr/bin/env node

var program = require('commander');
require('dotenv').config();

var save = require('../lib/mongodb-stream').createWriteStream;
var read = require('../lib/mongodb-stream').createReadStream;
var createMongoWriteStream = save;
var intercom = require('../');
var pkg = require('../package.json');
var es = require('event-stream');

program
  .version(pkg.version)
  .option(
    '-u, --url [mongodb://]',
    'Import Intercom data into [mongodb://] deployment',
    process.env.MONGODB_URL || 'mongodb://localhost:27017/intercom'
  );

program
  .command('users')
  .description('import all user data')
  .action(function(options) {
    var url = options.parent.url;

    var cacheTagInMemory = es.through(function(t) {
      intercom.TAGS[t.id] = t.name;
      this.emit('data', t);
    });

    var cacheTagInMongo = save({
      url: url,
      collection: 'tags'
    });

    var tags = intercom
      .getTagsStream()
      .pipe(cacheTagInMemory)
      .pipe(cacheTagInMongo);

    var cacheSegmentInMemory = es.through(function(s) {
      intercom.SEGMENTS[s.id] = s.name;
      this.emit('data', s);
    });

    var cacheSegmentInMongo = save({
      url: url,
      collection: 'segments'
    });

    var segments = intercom
      .getSegmentsStream()
      .pipe(cacheSegmentInMemory)
      .pipe(cacheSegmentInMongo);

    var admins = intercom.getAdminsStream().pipe(
      save({
        url: url,
        collection: 'admins'
      })
    );

    var conversations = intercom.getConversationsStream().pipe(
      save({
        url: url,
        collection: 'conversations'
      })
    );

    var cacheUserInMongo = save({
      url: url,
      collection: 'users'
    });

    var deps = es.merge(tags, segments, admins, conversations);

    deps.pipe(
      es.wait(function() {
        console.log('Loaded user dependencies', {
          segments: intercom.SEGMENTS,
          tags: intercom.SEGMENTS
        });
        intercom.getUsersScrollStream().pipe(cacheUserInMongo);
      })
    );
  });

program
  .command('admins')
  .description('import all admin user data')
  .action(function(options) {
    var opts = {
      url: options.parent.url,
      collection: 'admins'
    };

    intercom.getAdminsStream().pipe(createMongoWriteStream(opts));
  });

program
  .command('tags')
  .description('import all tag data')
  .action(function(options) {
    var opts = {
      url: options.parent.url,
      collection: 'tags'
    };

    intercom.getTagsStream().pipe(createMongoWriteStream(opts));
  });

program
  .command('tags')
  .description('import all conversation data')
  .action(function(options) {
    var url = options.parent.url;
    var opts = {
      url: url,
      collection: 'conversations'
    };

    intercom.getConversationsStream().pipe(createMongoWriteStream(opts));
  });

program
  .command('segments')
  .description('import all segment data')
  .action(function(options) {
    var opts = {
      url: options.parent.url,
      collection: 'segments'
    };

    intercom.getSegmentsStream().pipe(createMongoWriteStream(opts));
  });

var createWorkerQueue = require('async').queue;
program
  .command('events')
  .description('import all event data')
  .action(function(options) {
    var url = options.parent.url;

    var users = read({
      url: url,
      collection: 'users',
      options: { fields: { _id: 1 } }
    });

    var worker = createWorkerQueue(function(d, cb) {
      var src = intercom.getUserEventsStream(d._id);
      var dest = save({
        url: url,
        collection: 'events'
      });

      dest.on('end', function() {
        console.log('Finished event stream for', d);
        cb();
      });

      src.pipe(dest);
    }, 10);

    worker.drain = function() {
      console.log('all items have been processed');
    };

    users.pipe(
      es.through(function(d) {
        worker.push(d, function() {});
      })
    );
  });

program.parse(process.argv);
