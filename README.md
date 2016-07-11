# intercom-api-wrapper [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Light wrapper around intercom.io's API requests to abstract out intercom-specific methods

## Example
The wrapper exposes three basic functions `getUsers`, `getUsersBySegment`, and `getCount`.

```javascript
getUsers(<lastNumDays>, callback);
```
`getUsers` returns a list of users. Expects an integer for `lastNumDays` and a callback - `lastNumDays` limits the return results to only users created in the last `lastNumDays` days, omit this parameter to get all users ever created.

```javascript  
getUsersBySegment(<segment>, callback);
```
`getUsersBySegment` returns a list of users that are in a specified segment. Expects a string for `segment` and a callback - `segment` should be an existing segment in Intercom.

```javascript
getCount(<type>, <count>, callback);
```
`getCount` returns a list of key + count pairs, Expects a string for `type` and `count` and a callback - `type` determines the unit of grouping (company, segment, tag, users) and `count` determines how to bucket the units

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/intercom-api-wrapper.svg
[travis_url]: https://travis-ci.org/mongodb-js/intercom-api-wrapper
[npm_img]: https://img.shields.io/npm/v/intercom-api-wrapper.svg
[npm_url]: https://npmjs.org/package/intercom-api-wrapper
