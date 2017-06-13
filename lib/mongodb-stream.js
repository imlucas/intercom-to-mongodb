var es = require('event-stream');
var mongo = require('mongodb');

/* eslint no-console: 0 */
function connectWithQueue(options, handler) {
  var db;
  var queue = [];
  var collectionName = options.collection;
  var collection;
  var close = false;
  var debug = require('debug')('mongodb-stream:write:' + options.collection);

  var act = function(stream, doc) {
    if (!collection) {
      options.stream = stream;
      queue.push(doc);
      // debug('enqueued');
      return;
    }

    return handler(collection, doc, stream);
  };

  act.close = function() {
    close = true;
    if (!db) return;

    setTimeout(function() {
      db.close();
    }, 100);
  };

  function onConnect(err, _db) {
    if (err) return console.error(err);

    db = _db;
    collection = db.collection(collectionName);

    if (queue.length) {
      queue.map(function(d) {
        // debug('flush', d);
        handler(collection, d, options.stream);
      });
      debug('%d items flushed from queue', queue.length);
      queue = [];
    }

    debug('connected!');

    if (close) {
      debug('closing');
      setTimeout(function() {
        db.close();
      }, 100);
    }
    return;
  }
  debug('connect %s', options.url);
  mongo.connect(options.url, onConnect);
  return act;
}

function onUpdate(doc, stream) {
  return function(err) {
    if (!stream) {
      return console.error('queue but no stream', err);
    }
    if (err) return stream.emit('error', err);

    return stream.emit('data', doc);
  };
}

function write(collection, doc, stream) {
  var spec = { _id: doc._id };
  var opts = { upsert: true, w: 0 };
  collection.update(spec, doc, opts, onUpdate(doc, stream));
}

module.exports = {
  createWriteStream: function(options) {
    options.url =
      options.url ||
      process.env.MONGODB_URL ||
      'mongodb://localhost:27017/test';
    options.collection = options.collection || 'test';
    var debug = require('debug')('mongodb-stream:write:' + options.collection);
    // debug('createWriteStream', options);
    var save = connectWithQueue(options, write);
    var opCounter = 0;
    return es.through(
      function(d) {
        save(this, d);
        opCounter++;
      },
      function() {
        debug('complete. wrote %d docs', opCounter);
        this.emit('end');
        if (!options.keepOpen) {
          save.close();
        }
      }
    );
  },
  createReadStream: function(opts) {
    opts.url = opts.url || 'mongodb://localhost:27017/test';
    opts.collection = opts.collection || 'test';
    opts.query = opts.query || {};
    opts.options = opts.options || {};

    var collectionName = opts.collection;

    var stream = es.readable(function() {});
    var debug = require('debug')('mongodb-stream:read:' + collectionName);

    mongo.connect(opts.url, function(err, db) {
      if (err) return console.error(err);

      debug('connected!');
      debug('running find', opts.query, opts.options);
      var cursor = db.collection(collectionName).find(opts.query, opts.options);
      cursor.stream().pipe(
        es.through(
          function(d) {
            stream.emit('data', d);
          },
          function() {
            stream.emit('end');
          }
        )
      );
      return;
    });
    return stream;
  }
};
