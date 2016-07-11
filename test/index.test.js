/* eslint no-unused-expressions:0 */

var intercomApiWrapper = require('../lib/index.js');
var testVars = require('./testVars.js');
var request = require('request');
var expect = require('chai').expect;
var sinon = require('sinon');

describe('Intercom api wrapper testing', function() {
  before(function(done) {
    var stub = sinon.stub(request, 'get');
    stub.withArgs(testVars.usersOptions).yields(null, { statusCode: '200' }, testVars.usersOutput);
    stub.withArgs(testVars.usersCreatedSinceOptions).yields(null, { statusCode: '200' }, testVars.usersOutput);
    stub.withArgs(testVars.usersBySegmentOptions).yields(null, { statusCode: '200' }, testVars.usersOutput);
    stub.withArgs(testVars.segmentsOptions).yields(null, { statusCode: '200' }, testVars.segmentsOutput);
    stub.withArgs(testVars.countOptions).yields(null, { statusCode: '200' }, testVars.countsOutput);
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
      result.on('data', function(data) {
        expect(data).to.equal(testVars.usersOutput);
      });
      done();
    });
  });

  it('getUsers with lastNumDays should return a stream', function(done) {
    intercomApiWrapper.getUsers(1, function(err, result) {
      if (err) return done(err);
      expect(result).to.be.an('object');
      expect(result.__HighlandStream__).to.be.true;
      result.on('data', function(data) {
        data.to.equal(testVars.usersOutput);
      });
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
      result.on('data', function(data) {
        expect(data).to.equal(testVars.usersOutput);
      });
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
      result.on('data', function(data) {
        expect(data).to.equal(testVars.countsOutput);
      });
      done();
    });
  });
});
