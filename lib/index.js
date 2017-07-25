/* eslint no-console: 0 */
var debug = require('debug')('intercom-to-mongodb');
var request = require('request');
var es = require('event-stream');

require('dotenv').config();

var URL = 'https://api.intercom.io';
var auth = {
  bearer: process.env.INTERCOM_ACCESS_TOKEN
};

function epochToDate(secs) {
  var d = new Date(0);
  d.setUTCSeconds(secs);
  return d;
}

module.exports.TAGS = {};
module.exports.SEGMENTS = {};
module.exports.ADMINS = {};
module.exports.CONVERSATIONS = {};

var parsers = {
  tags: function(d) {
    d._id = d.id;
    delete d.id;
    delete d.type;
    return d;
  },
  segments: function(d) {
    d._id = d.id;
    delete d.id;
    delete d.type;
    d.created_at = epochToDate(d.created_at);
    d.updated_at = epochToDate(d.updated_at);
    return d;
  },
  conversations: function(d) {
    d._id = d.id;
    delete d.id;
    delete d.type;
    d.created_at = epochToDate(d.created_at);
    d.updated_at = epochToDate(d.updated_at);
    return d;
  },
  events: function(d) {
    d._id = d.id;
    d.created_at = epochToDate(d.created_at);
    delete d.email;
    delete d.id;

    d.app_user_id = d.user_id;
    delete d.user_id;

    delete d.type;
    return d;
  },
  admins: function(d) {
    d._id = d.id;
    delete d.id;
    delete d.type;
    return d;
  },
  users: function(d) {
    if (!d._id) {
      d._id = d.id;
      delete d.id;
    }

    var doc = {
      _id: d._id,
      coordinates: [
        d.location_data.longitude || 0,
        d.location_data.latitude || 0
      ],
      app_user_id: d.user_id,
      session_count: d.session_count,
      user_agent_data: d.user_agent_data,
      unsubscribed_from_emails: d.unsubscribed_from_emails,
      marked_email_as_spam: d.marked_email_as_spam,
      has_hard_bounced: d.has_hard_bounced,
      last_request_at: epochToDate(d.last_request_at),
      created_at: epochToDate(d.created_at),
      remote_created_at: epochToDate(d.remote_created_at),
      signed_up_at: epochToDate(d.signed_up_at),
      updated_at: epochToDate(d.updated_at),
      tags: d.tags.tags.map(function(t) {
        return module.exports.TAGS[t.id] || t.id;
      }),
      segments: d.segments.segments.map(function(s) {
        return module.exports.SEGMENTS[s.id] || s.id;
      }),
      custom_attributes: d.custom_attributes,
      location: {
        city_name: d.location_data.city_name,
        continent_code: d.location_data.continent_code,
        country_name: d.location_data.country_name,
        latitude: d.location_data.latitude,
        longitude: d.location_data.longitude,
        postal_code: d.location_data.postal_code,
        region_name: d.location_data.region_name,
        timezone: d.location_data.timezone,
        country_code: d.location_data.country_code
      },
      city_name: d.location_data.city_name,
      continent_code: d.location_data.continent_code,
      country_name: d.location_data.country_name,
      latitude: d.location_data.latitude,
      longitude: d.location_data.longitude,
      postal_code: d.location_data.postal_code,
      region_name: d.location_data.region_name,
      timezone: d.location_data.timezone,
      country_code: d.location_data.country_code
    };
    return doc;
  }
};

var ENTITY_TYPES = Object.keys(parsers);

var getStream = function(type, options, stream) {
  if (ENTITY_TYPES.indexOf(type) === -1) {
    throw new TypeError('Unknown entity type: ' + type);
  }

  function onResponse(err, response, body) {
    err = err || body.errors;

    if (!err && body.errors) {
      err = new Error(
        'API Error: ' +
          body.errors[0].message +
          '(code: ' +
          body.errors[0].code +
          ')'
      );
    }

    var data = body && body[type];
    if (!data && !err) {
      debug('%ss in body is falsy', type, body);
      err = new Error('No request error but no data!');
    }

    if (err) {
      console.error('Error fetching %ss', type, {
        options: options,
        error: err
      });
      stream.emit('error', err);
      return;
    }

    data.map(parsers[type]).forEach(stream.emit.bind(stream, 'data'));

    if (body.pages && body.pages.next) {
      getStream(type, { uri: body.pages.next }, stream);
    } else if (body.scroll_param && data.length) {
      getStream(
        type,
        {
          uri: options.uri,
          qs: {
            scroll_param: body.scroll_param
          }
        },
        stream
      );
    } else {
      debug('completed fetch %ss', type, options);
      stream.emit('end');
    }
  }

  var isParent = !stream;
  if (isParent) {
    stream = es.readable(function(count, cb) {
      cb();
    });
  }

  debug('fetching %ss', type, options);
  options.json = true;
  options.auth = auth;

  request.get(options, onResponse);
  return stream;
};

module.exports.getUserEventsStream = function(intercomUserId) {
  return getStream('events', {
    uri: URL + '/events',
    qs: { type: 'user', intercom_user_id: intercomUserId }
  });
};

function getUsersScrollStream(lastNumDays) {
  var options = {
    uri: URL + '/users/scroll'
  };

  if (lastNumDays) {
    options.qs = { created_since: lastNumDays };
  }

  return getStream('users', options);
}

var BASIC_ENTITY_TYPES = (module.exports.BASIC_ENTITY_TYPES = [
  'tags',
  'segments',
  'conversations',
  'admins'
]);

module.exports.stream = function(entityType) {
  if (BASIC_ENTITY_TYPES.indexOf(entityType) > -1) {
    return getStream(entityType, {
      uri: URL + '/' + entityType
    });
  }

  if (entityType === 'users') {
    return getUsersScrollStream();
  }
};
