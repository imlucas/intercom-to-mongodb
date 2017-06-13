#!/usr/bin/env node

var program = require('commander');
require('dotenv').config();

var mongo = require('../lib/mongodb-stream');
var save = mongo.createWriteStream;
var read = mongo.createReadStream;
var intercom = require('../');
var pkg = require('../package.json');
var es = require('event-stream');

program.version(pkg.version);

program.command('users').description('import all user data').action(function() {
  var cacheTagInMemory = es.through(function(t) {
    intercom.TAGS[t.id] = t.name;
    this.emit('data', t);
  });

  var cacheTagInMongo = save({
    collection: 'tags'
  });

  var tags = intercom
    .stream('tags')
    .pipe(cacheTagInMemory)
    .pipe(cacheTagInMongo);

  var cacheSegmentInMemory = es.through(function(s) {
    intercom.SEGMENTS[s.id] = s.name;
    this.emit('data', s);
  });

  var cacheSegmentInMongo = save({
    collection: 'segments'
  });

  var segments = intercom
    .stream('segments')
    .pipe(cacheSegmentInMemory)
    .pipe(cacheSegmentInMongo);

  var admins = intercom.stream('admins').pipe(
    save({
      collection: 'admins'
    })
  );

  var conversations = intercom.stream('conversations').pipe(
    save({
      collection: 'conversations'
    })
  );

  var cacheUserInMongo = save({
    collection: 'users'
  });

  var deps = es.merge(tags, segments, admins, conversations);

  deps.pipe(
    es.wait(function() {
      intercom.stream('users').pipe(cacheUserInMongo);
    })
  );
});

intercom.BASIC_ENTITY_TYPES.forEach(function(t) {
  program.command(t).description('import data for all ' + t).action(function() {
    intercom.stream(t).pipe(
      save({
        collection: t
      })
    );
  });
});

var createWorkerQueue = require('async').queue;
program
  .command('events')
  .description('import all event data')
  .action(function() {
    var users = read({
      collection: 'users',
      options: { fields: { _id: 1 } }
    });

    var saveEventsOptions = {
      collection: 'events'
    };

    var worker = createWorkerQueue(function(d, cb) {
      var src = intercom
        .getUserEventsStream(d._id)
        .on('error', function(err) {
          console.error('Error fetching event stream for', d, err);
          console.error('Trying to continue');
          cb();
        })
        .pipe(
          es.map(function(doc, fn) {
            if (/^error/.test(doc.event_name)) {
              // drop old gnarly error events
              return fn();
            }
            fn(null, doc);
          })
        );
      var dest = save(saveEventsOptions);
      dest.on('end', function() {
        console.log('Finished event stream for', d);
        cb();
      });

      src.pipe(dest);
    }, 2);

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
