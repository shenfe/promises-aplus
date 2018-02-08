# promises-aplus

<a href="https://promisesaplus.com/">
    <img src="https://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo"
         title="Promises/A+ 1.0 compliant" align="right" />
</a>

A lightweight (< 100 LOC in main program) implementation of [Promises/A+](https://promisesaplus.com/) (indexed on 2017/12/23).

## Guide

```bash
npm install --save @hengwu/promises-aplus
```

## Implementation

### Prototype Methods

* then
* catch
* done
* finally
* resolve
* reject

### Static Methods

* resolve, resolved
* reject, rejected
* deferred
* all
* race

## Test

```bash
npm run test
```

The test suite is provided by [promises-aplus/promises-tests](https://github.com/promises-aplus/promises-tests).

## References

* [https://promisesaplus.com/](https://promisesaplus.com/)
* [https://www.promisejs.org/api/](https://www.promisejs.org/api/)
* [https://github.com/abdulapopoola/Adehun](https://github.com/abdulapopoola/Adehun)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2017-present, [shenfe](https://github.com/shenfe)
