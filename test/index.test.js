/* eslint no-unused-expressions:0 */

var intercomApiWrapper = require('../lib/index.js');
var request = require('request');
var expect = require('chai').expect;
var sinon = require('sinon');

var URL = 'https://api.intercom.io';
var auth = {
  'user': process.env.INTERCOM_APP_ID,
  'pass': process.env.INTERCOM_API_KEY
};

/* Different options that request.get can receive as arguments
 * Set up to stub request.get correctly and return sensible results
 */
var getUsersOptions = {
  uri: URL + '/users',
  json: true,
  auth: auth
};
var getUsersCreatedSinceOptions = {
  uri: URL + '/users',
  json: true,
  auth: auth,
  qs: {'created_since': 1}
};
var getUsersBySegmentOptions = {
  uri: URL + '/users',
  json: true,
  auth: auth,
  qs: {'segment_id': 0}
};
var getSegmentsOptions = {
  uri: URL + '/segments',
  json: true,
  auth: auth
};
var getCountOptions = {
  uri: URL + '/counts',
  json: true,
  auth: auth,
  qs: { 'type': 'user', 'count': 'segment' }
};

describe('intercom-api-wrapper', function() {
  before(function(done) {
    var stub = sinon.stub(request, 'get');
    stub.withArgs(getUsersOptions).yields(null, { statusCode: '200' }, { 'users': 'value' });
    stub.withArgs(getUsersCreatedSinceOptions).yields(null, { statusCode: '200' }, { 'users': 'value' });
    stub.withArgs(getSegmentsOptions).yields(null, { statusCode: '200' }, { 'segments': [{ id: 0, name: 'test' }] });
    stub.withArgs(getUsersBySegmentOptions).yields(null, { statusCode: '200' }, { 'users': 'value' });
    stub.withArgs(getCountOptions).yields(null, { statusCode: '200' }, { 'segment': [{ 'test': 0 }] });
    done();
  });

  after(function(done) {
    request.get.restore();
    done();
  });

  it('api should exist', function() {
    expect(intercomApiWrapper).to.exist;
  });

  it('getUsers with no arguments should return a stream', function(done) {
    intercomApiWrapper.getUsers(null, function(err, result) {
      if (err) return done(err);
      expect(result).to.be.an('object');
      expect(result.__HighlandStream__).to.be.true;
      done();
    });
  });

  it('getUsers with lastNumDays should return a stream', function(done) {
    intercomApiWrapper.getUsers(1, function(err, result) {
      if (err) return done(err);
      expect(result).to.be.an('object');
      expect(result.__HighlandStream__).to.be.true;
      done();
    });
  });

  it('getUsersBySegment with no segment should return no segment provided error', function(done) {
    intercomApiWrapper.getUsersBySegment(null, function(err, result) {
      expect(err).to.equal('NO SEGMENT PROVIDED');
      expect(result).to.be.undefined;
      done();
    });
  });

  it('getUsersBySegment with bad segment should return segment does not exist error', function(done) {
    intercomApiWrapper.getUsersBySegment('bad segment', function(err, result) {
      expect(err).to.equal('SEGMENT PROVIDED DOES NOT EXIST');
      expect(result).to.be.undefined;
      done();
    });
  });

  it('getUsersBySegment with correct segment should return a stream', function(done) {
    intercomApiWrapper.getUsersBySegment('test', function(err, result) {
      if (err) return done(err);
      expect(result).to.be.an('object');
      expect(result.__HighlandStream__).to.be.true;
      done();
    });
  });

  it('getCount with no type should return no type provided error', function(done) {
    intercomApiWrapper.getCount(null, 'test', function(err, result) {
      expect(err).to.equal('NO TYPE OR COUNT PROVIDED');
      expect(result).to.be.undefined;
      done();
    });
  });

  it('getCount with no count should return no count provided error', function(done) {
    intercomApiWrapper.getCount('test', null, function(err, result) {
      expect(err).to.equal('NO TYPE OR COUNT PROVIDED');
      expect(result).to.be.undefined;
      done();
    });
  });

  it('getCount with correct type and count should return a stream', function(done) {
    intercomApiWrapper.getCount('user', 'segment', function(err, result) {
      if (err) return done(err);
      expect(result).to.be.an('object');
      expect(result.__HighlandStream__).to.be.true;
      done();
    });
  });
});
