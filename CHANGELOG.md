# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.10](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.9...v0.7.10) (2019-10-13)


### Bug Fixes

* **reinit:** client on deadline exceeded error ([f543d35](https://github.com/Workpop/job-queue-google-pubsub/commit/f543d35))



### [0.7.9](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.8...v0.7.9) (2019-10-11)


### Bug Fixes

* **deps:** downgrade pubsub to 0.30.1 & google-gax to 1.1.4 ([6a80860](https://github.com/Workpop/job-queue-google-pubsub/commit/6a80860))
* **errorHandling:** on publish promise rejection ([a07239a](https://github.com/Workpop/job-queue-google-pubsub/commit/a07239a))
* **retry:** stop promise rejections ([ac12564](https://github.com/Workpop/job-queue-google-pubsub/commit/ac12564))



### [0.7.8](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.7...v0.7.8) (2019-10-09)


### Bug Fixes

* **deps:** Pin google-gax version to 1.6.2 ([ba8e42a](https://github.com/Workpop/job-queue-google-pubsub/commit/ba8e42a))
* **error:** recreate the pubsub client once subscription fails ([aed37f7](https://github.com/Workpop/job-queue-google-pubsub/commit/aed37f7))



### [0.7.7](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.6...v0.7.7) (2019-10-08)


### Bug Fixes

* **deps:** updated google-auth-library to v 5 used by pubsub 0.31.1 ([060737b](https://github.com/Workpop/job-queue-google-pubsub/commit/060737b))
* **retry:** getting the subscription when deadline exceeded ([d5a1034](https://github.com/Workpop/job-queue-google-pubsub/commit/d5a1034))



### [0.7.6](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.5...v0.7.6) (2019-10-07)


### Bug Fixes

* **error:** better handing of deadline exceeded errors ([eec3513](https://github.com/Workpop/job-queue-google-pubsub/commit/eec3513))



### [0.7.5](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.4...v0.7.5) (2019-10-07)



### [0.7.4](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.3...v0.7.4) (2019-10-07)


### Bug Fixes

* **worker:** fixed error handling in getting subscription ([239c10d](https://github.com/Workpop/job-queue-google-pubsub/commit/239c10d))



### [0.7.3](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.2...v0.7.3) (2019-07-10)


### Bug Fixes

* **errorHandling:** More transient error handling ([df97ede](https://github.com/Workpop/job-queue-google-pubsub/commit/df97ede))
* **publisher:** Add support for plain values ([2de8619](https://github.com/Workpop/job-queue-google-pubsub/commit/2de8619))
* **worker:** Handle internal errors and retry with backoff ([6ea20d1](https://github.com/Workpop/job-queue-google-pubsub/commit/6ea20d1))



### [0.7.2](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.1...v0.7.2) (2019-06-24)



### [0.7.1](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.7.0...v0.7.1) (2019-06-24)



## [0.7.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.6.0...v0.7.0) (2019-06-23)


### Features

* Update pubsub to v0.30 & convert to TS ([#8](https://github.com/Workpop/job-queue-google-pubsub/issues/8)) ([a21a4b1](https://github.com/Workpop/job-queue-google-pubsub/commit/a21a4b1))



## [0.6.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.5.0...v0.6.0) (2019-06-17)


### Features

* Build to ES6 for node 8+ ([e85a547](https://github.com/Workpop/job-queue-google-pubsub/commit/e85a547))
* Update pubsub to v0.29 ([3023157](https://github.com/Workpop/job-queue-google-pubsub/commit/3023157))



<a name="0.5.0"></a>
# [0.5.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.4.2...v0.5.0) (2019-04-29)



<a name="0.4.2"></a>
## [0.4.2](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.4.1...v0.4.2) (2018-03-21)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.4.0...v0.4.1) (2018-03-21)


### Bug Fixes

* **logs:** silence trace, improve errors ([2d64b09](https://github.com/Workpop/job-queue-google-pubsub/commit/2d64b09))



<a name="0.4.0"></a>
# [0.4.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.3.3...v0.4.0) (2018-03-02)


### Features

* **delay:** pass a callback to processingRateConfigUpdateCallback to allow correct interop with Meteor ([0e66e0f](https://github.com/Workpop/job-queue-google-pubsub/commit/0e66e0f))



<a name="0.3.3"></a>
## [0.3.3](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.3.2...v0.3.3) (2018-03-02)


### Bug Fixes

* **throttle:** bind this to _updateProcessingRateConfig ([f0e6e33](https://github.com/Workpop/job-queue-google-pubsub/commit/f0e6e33))



<a name="0.3.2"></a>
## [0.3.2](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.3.0...v0.3.2) (2017-06-23)



<a name="0.3.0"></a>
# [0.3.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.2.2...v0.3.0) (2017-06-20)


### Features

* **worker:** Let worker created set batch size and rate ([55381db](https://github.com/Workpop/job-queue-google-pubsub/commit/55381db))



<a name="0.2.2"></a>
## [0.2.2](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.2.1...v0.2.2) (2017-03-14)


### Bug Fixes

* **package.json:** update main in package.json ([d91a97d](https://github.com/Workpop/job-queue-google-pubsub/commit/d91a97d))



<a name="0.2.1"></a>
## [0.2.1](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.2.0...v0.2.1) (2017-03-14)


### Bug Fixes

* **build:** add .npmignore ([211fc2f](https://github.com/Workpop/job-queue-google-pubsub/commit/211fc2f))



<a name="0.2.0"></a>
# [0.2.0](https://github.com/Workpop/job-queue-google-pubsub/compare/v0.1.0...v0.2.0) (2017-03-14)


### Bug Fixes

* **tests:** test sending objects as message ([5a43f9e](https://github.com/Workpop/job-queue-google-pubsub/commit/5a43f9e))



<a name="0.1.0"></a>
# 0.1.0 (2017-03-08)
