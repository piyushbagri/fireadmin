var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('firebase'), require('lodash')) : typeof define === 'function' && define.amd ? define(['firebase', 'lodash'], factory) : global.Fireadmin = factory(global.Firebase, global._);
})(this, function (Firebase, _) {
	'use strict';

	Firebase = 'default' in Firebase ? Firebase['default'] : Firebase;
	_ = 'default' in _ ? _['default'] : _;

	var config = {};

	//Set default log level to debug
	var logLevel = 'debug';
	//Set log level from config
	if (config.logLevel) {
		logLevel = config.logLevel;
	}

	var logger = {
		log: function log(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'production') {
				runConsoleMethod('log', msgArgs);
			} else {
				runConsoleMethod('log', msgArgs);
			}
		},
		info: function info(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'production') {
				runConsoleMethod('info', msgArgs);
			} else {
				runConsoleMethod('info', msgArgs);
			}
		},
		warn: function warn(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'production') {
				runConsoleMethod('warn', msgArgs);
			} else {
				runConsoleMethod('warn', msgArgs);
			}
		},
		debug: function debug(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'production') {
				// runConsoleMethod('debug', msgArgs);
				//Do not display console debugs in production
			} else {
					runConsoleMethod('debug', msgArgs);
				}
		},
		error: function error(logData) {
			var msgArgs = buildMessageArgs(logData);
			if (config.envName == 'production') {
				//TODO: Log to external logger
				runConsoleMethod('error', msgArgs);
			} else {
				runConsoleMethod('error', msgArgs);
			}
		}
	};

	function runConsoleMethod(methodName, methodData) {
		//Safley run console methods or use console log
		if (methodName && console[methodName]) {
			return console[methodName].apply(console, methodData);
		} else {
			return console.log.apply(console, methodData);
		}
	}
	function buildMessageArgs(logData) {
		var msgStr = '';
		var msgObj = {};
		//TODO: Attach time stamp
		//Attach location information to the beginning of message
		if (_.isObject(logData)) {
			if (logLevel == 'debug') {
				if (_.has(logData, 'func')) {
					if (_.has(logData, 'obj')) {
						//Object and function provided
						msgStr += '[' + logData.obj + '.' + logData.func + '()]\n ';
					} else if (_.has(logData, 'file')) {
						msgStr += '[' + logData.file + ' > ' + logData.func + '()]\n ';
					} else {
						msgStr += '[' + logData.func + '()]\n ';
					}
				}
			}
			//Print each key and its value other than obj and func
			_.each(_.omit(_.keys(logData)), function (key, ind, list) {
				if (key != 'func' && key != 'obj') {
					if (key == 'description' || key == 'message') {
						msgStr += logData[key];
					} else if (_.isString(logData[key])) {
						// msgStr += key + ': ' + logData[key] + ', ';
						msgObj[key] = logData[key];
					} else {
						//Print objects differently
						// msgStr += key + ': ' + logData[key] + ', ';
						msgObj[key] = logData[key];
					}
				}
			});
			msgStr += '\n';
		} else if (_.isString(logData)) {
			msgStr = logData;
		}
		var msg = [msgStr, msgObj];

		return msg;
	}

	var Fireadmin = (function () {
		/* Constructor
   * @param {string} appName Name of application
   */

		function Fireadmin(url, opts) {
			_classCallCheck(this, Fireadmin);

			if (!url) {
				logger.error({ description: 'Application name requires to use Fireadmin.', func: 'constructor', obj: 'Fireadmin' });
				throw new Error('Application name is required to use Fireadmin');
			} else {
				this.ref = new Firebase(url);
				this.fbUrl = url;
				this.appName = AppNameFromUrl(url);
			}
			if (opts) {
				this.options = opts;
			}
		}

		_createClass(Fireadmin, [{
			key: 'createObject',

			/**
    * This callback is displayed as part of the Requester class.
    * @callback Fireadmin~errorCb
    * @param {String} code
    * @param {String} message
    */
			/**
    * Creates an object provided the name of the list the object will go into and the object itthis.
    * The object is created with a createdAt parameter that is a server timestamp from Firebase.
    * If a user is currently signed in, the object will contain the author's `$uid` under the author parameter.
    * @param {String} listName - The name of the list the object will be put into. `Required`
    * @param {Object} objectData - Data you wish to be contained within new object. `Required`
    * @param {Function} onSuccess - Function that runs when your object has been created successfully and returns newly created object. `Optional`
    * @param {Function} onError - Function that runs if there is an error creating the object. `Optional`
    * @example
    * //creates new message object in message list
    * fa.createObject('messages', {title:Example, content:'Cool Message'}, ).then(function(newMsg){
    *  logger.log('New Message created successfuly:', newMsg);
    * }, function(err){
    *  logger.error('Error creating new message:', err);
    * });
    */
			value: function createObject(listName, obj) {
				var _this = this;

				var auth = this.ref.getAuth();
				if (auth) {
					obj.author = auth.uid;
				}
				obj.createdAt = Date.now();
				return new Promise(function (resolve, reject) {
					_this.ref.child(listName).push(obj, function (err) {
						if (!err) {
							return resolve(obj);
						} else {
							return reject(err);
						}
					});
				});
			}

			/**
    * Gets list of objects created by the currently logged in User.
    * @param {String | Array} listPath -  The name or path of the list the objects will be grabbed from. `Required`
    * @param {String} Uid - The Uid of the user that created objects. `Required`
    * @param {Function} onSuccess - Function that runs when the list has been retrieved successfully. `Optional`
    * @param {Fireadmin~errorCb} onError -  Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * var uid = 'simplelogin:1';
    * fb.listByUid('messages', uid, function(messageList){
    *  logger.log('List of messages by ' + uid + ' : ', messageList);
    * }, function(err){
    *  logger.error('Error getting message list:', err);
    * });
    */
		}, {
			key: 'listByCurrentUser',
			value: function listByCurrentUser(listName) {
				var _this2 = this;

				if (!listName) {
					return Promise.reject({ message: 'Listname required to list objects.' });
				}
				if (this.isAuthorized) {
					return new Promise(function (resolve, reject) {
						var authorObjQuery = _this2.ref.child(listName).orderByChild('author').equalTo(auth.uid);
						authorObjQuery.on('value', function (listSnap) {
							return resolve(listSnap.val());
						}, function (err) {
							return reject(err);
						});
					});
				} else {
					var error = { code: 'INVALID_AUTH', message: 'listByCurrentUser cannot load list without current user' };
					logger.error(error.message);
					return Promise.reject(error);
				}
			}

			/**
    * Gets list of objects created by the currently logged in User.
    * @param {String | Array} listPath -  The name or path of the list the objects will be grabbed from. `Required`
    * @param {String} Uid - The Uid of the user that created objects. `Required`
    * @param {Function} onSuccess - Function that runs when the list has been retrieved successfully. `Optional`
    * @param {Fireadmin~errorCb} onError -  Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * var uid = 'simplelogin:1';
    * fb.listByUid('messages', uid, function(messageList){
    *  logger.log('List of messages by ' + uid + ' : ', messageList);
    * }, function(err){
    *  logger.error('Error getting message list:', err);
    * });
    */
		}, {
			key: 'listByUid',
			value: function listByUid(listPath, uid) {
				var _this3 = this;

				return new Promise(function (resolve, reject) {
					_this3.fbRef(listPath).orderByChild('author').equalTo(uid).on('value', function (listSnap) {
						return Promise.resolve(listSnap.val());
					}, function (err) {
						return Promise.reject(err);
					});
				});
			}

			/**
     * Get total user count
     * @param {Function} onSuccess - Function that returns total user count. `Optional`
     * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
     * @example
     * fa.getUserCount('users', function(count){
     *  logger.log('There are is a total of ' + count + ' users.');
     * });
     */
		}, {
			key: 'getUserCount',
			value: function getUserCount() {
				var _this4 = this;

				return new Promise(function (resolve, reject) {
					_this4.ref.child('users').on('value', function (usersListSnap) {
						resolve(usersListSnap.numChildren());
					}, function (err) {
						logger.error({ description: 'Error getting user count.', func: 'getUserCount', obj: 'Fireadmin' });
						reject(err);
					});
				});
			}

			/** Get the number of users that are currently online.
    * @memberOf Fireadmin#
    * @param {Function} onSuccess - Function that returns number of users currently online. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * fa.getOnlineUserCount(function(count){
    *   logger.log('There are ' + count + ' users currently online.');
    * });
    *
    */
		}, {
			key: 'getOnlineUserCount',
			value: function getOnlineUserCount() {
				var _this5 = this;

				return new Promise(function (resolve, reject) {
					_this5.ref.child('presence').on('value', function (onlineUserSnap) {
						logger.log('There are currently' + onlineUserSnap.numChildren() + ' users online.');
						resolve(onlineUserSnap.numChildren());
					}, function (err) {
						reject(err);
					});
				});
			}

			/**
    * Get the number of sessions between two times
    * @param {Number} startTime - The time at which to start the between period (in UTC ms). `Required`
    * @param {Number} endTime - The time at which to start the between period (in UTC ms). `Required`
    * @param {Function} onSuccess - Function that runs on completion of gathering list count. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * //String list name
    * fa.getObjectCount('users', function(count){
    *  logger.log('There are ' + count + ' users');
    * });
    */
		}, {
			key: 'sessionsBetween',
			value: function sessionsBetween(time1, time2) {
				var _this6 = this;

				logger.log({ description: 'Sessions between called.', startTime: time1, endTime: time2, func: 'sessionsBetween', obj: 'Fireadmin' });
				return new Promise(function (resolve, reject) {
					_this6.ref.child('sessions').orderByChild('ended').startAt(time1).endAt(time2).on('value', function (sessionsSnap) {
						resolve(sessionsSnap.numChildren());
					}, function (err) {
						logger.error({ description: 'Error getting sessions between specified times.', error: err, func: 'sessionsBetween', obj: 'Fireadmin' });
						reject({ message: 'Error getting sessions.' });
					});
				});
			}

			/**
    * Get the number of sessions since a specific time
    * @param {String} time - The UTC time to calculate from.
    * @param {Function} onSuccess - Function that runs on completion of gathering list count. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * var dt = new Date(); //Create a new Data object
    * dt.setMonth(dt.getMonth()-1); //Set date back a month
    * var monthAgo = dt.getTime(); //Convert to UTC time
    * //Get number of sessions since a month ago
    * fa.sessionsSince(monthAgo, function(count){
    *  logger.log('There are ' + count + ' sessions in the past month');
    * });
    */
		}, {
			key: 'sessionsSince',
			value: function sessionsSince(time) {
				var _this7 = this;

				return new Promise(function (resolve, reject) {
					_this7.ref.child('sessions').orderByChild('ended').startAt(time).endAt(Date.now()).on('value', function (sessionsSnap) {
						return resolve(sessionsSnap.numChildren());
					}, function (err) {
						logger.error({ description: 'Error getting sessions between specified times.', error: err, func: 'sessionsSince', obj: 'Fireadmin' });
						return reject(err);
					});
				});
			}

			/**
    * Get count of objects in a given path or list
    * @param {Function} onSuccess - Function that runs on completion of gathering average session length. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * //Get the average session length
    * fa.averageSessionLength(function(count){
    *  logger.log('The average session length is ~' + count ' mins');
    * });
    */
		}, {
			key: 'averageSessionLength',
			value: function averageSessionLength() {
				var _this8 = this;

				return new Promise(function (resolve, reject) {
					_this8.ref.child('sessions').on('value', function (sessionsSnap) {
						var totalLength = null;
						var sessionCount = sessionsSnap.numChildren();
						sessionsSnap.forEach(function (sessionSnap) {
							var session = sessionSnap.val();
							if (session.hasOwnProperty('ended') && session.hasOwnProperty('began')) {
								//Gather length of session
								// Convert difference in ms to minutes
								var conversion = (session.ended - session.began) / (1000 * 60);
								totalLength = totalLength + conversion;
								logger.log('total length is now:', totalLength);
							} else {
								logger.log('removing unfinished session:', sessionSnap.val());
								sessionCount--;
								logger.log('session count:', sessionCount);
							}
						});
						logger.log('totalLength:', totalLength);
						var average = Math.floor(totalLength / sessionCount);
						logger.log('average in minutes:', average);
						return resolve(average);
					}, function (err) {
						return reject(err);
					});
				});
			}
		}, {
			key: 'removeUserSessions',
			value: function removeUserSessions(uid) {
				var _this9 = this;

				return new Promise(function (resolve, reject) {
					_this9.ref.child('sessions').orderByChild('user').equalTo(uid).on('value', function (sessionsSnap) {
						var sessionCount = sessionsSnap.numChildren();
						sessionsSnap.forEach(function (session) {
							session.ref().remove();
						});
						logger.log(sessionCount + ' Sessions sucessfully removed');
						return resolve();
					}, function (err) {
						return reject(err);
					});
				});
			}
		}, {
			key: 'customAuthToken',
			value: function customAuthToken(img) {
				//Send file to server
				var fa = this;
				var reqData = { appName: fa.appName };
				apiRequest('auth', reqData, function (res) {
					if (res.hasOwnProperty('token')) {
						logger.log('auth request response:', res);
						return Promise.resolve(res);
					} else {
						return Promise.reject({ code: 'SERVER_ERROR' });
					}
				}, function (err) {
					return Promise.reject(err);
				});
			}

			/** Modified version of Firebase's authWithPassword that handles presence
    * @memberOf Fireadmin#
    * @param {Object | String} loginData - Login data object or string for 3rd Party Signup (Twitter, Github, Google) `Required`
    * @param {Object} loginData.email - Email of new user (`Required` only for email signup).
    * @param {Function} onSuccess Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.userSignup({email:test@test.com, password:'testtest'}, function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'userSignup',
			value: function userSignup(signupData) {
				var _this10 = this;

				if (typeof signupData === 'object' && signupData.hasOwnProperty('email')) {
					//Email signup
					if (!signupData.hasOwnProperty('password') && signupData.password.length <= 8) {
						return handleCb(errorCb, { message: 'A valid Password is required to signup.' });
					}
					//Create new user in simple login
					return new Promise(function (resolve, reject) {
						_this10.createUser(signupData, function (error) {
							if (error === null) {
								logger.log('[emailSignup] User created successfully. Logging in as new user...');
								// Login with new account
								_this10.emailAuth(signupData, function (authData) {
									//Create new user profile
									createUserProfile(authData, _this10.ref, function (userAccount) {
										resolve(userAccount);
									}, function (err) {
										//Error creating profile
										reject(err);
									});
								}, function (err) {
									//Error authing with email
									reject(err);
								});
							} else {
								//Error creating new User
								logger.error('[emailSignup] Error creating user:', error.message);
								reject(error);
							}
						});
					});
				} else if (signupData.hasOwnProperty('type') && signupData.type == 'username') {
					//[TODO] User signup with with custom auth token with username as uid
					//Username signup
					//request a signup with username as uid
					apiRequest('signup', signupData, function (res) {
						logger.log('request for token successful:', res);
						return _this10.authWithCustomToken(res.token, function (err, authData) {
							if (err) {
								return Promise.reject(err);
							}
							return createUserProfile(authData, _this10.ref, function (userAccount) {
								return Promise.resolve(userAccount);
							}, function (err) {
								//Error creating profile
								return Promise.reject(err);
							});
						});
					}, function (err) {
						return Promise.reject(err);
					});
				} else if (typeof signupData == 'string' || signupData.hasOwnProperty('type')) {
					//3rd Party Signup
					var provider = typeof signupData === 'string' ? signupData : signupData.type;
					// Auth using 3rd party OAuth
					return this.authWithOAuthPopup(provider, function (err, authData) {
						if (err) {
							return Promise.reject(err);
						}
						//Create new profile with user data
						return createUserProfile(authData, _this10.ref, function (userAccount) {
							return Promise.resolve(userAccount);
						}, function (err) {
							//Error creating profile
							return Promise.reject(err);
						});
					});
				}
			}

			/** Modified version of Firebase's authWithPassword that handles presence
    * @memberOf Fireadmin#
    * @param {Object} loginData Login data of new user
    * @param {Function} onSuccess Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.emailAuth({email:test@test.com, password:'testtest'}, function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'emailAuth',
			value: function emailAuth(loginData) {
				var _this11 = this;

				return new Promise(function (resolve, reject) {
					_this11.ref.authWithPassword(loginData, function (error, authData) {
						if (error === null) {
							// user authenticated with Firebase
							logger.log({ description: 'Successfully authed.', authData: authData, userId: authData.uid, provider: authData.provider, func: 'emailAuth', obj: 'Fireadmin' });
							// Manage presence
							_this11.setupPresence(authData.uid);
							// [TODO] Check for account/Add account if it doesn't already exist
							return resolve(authData);
						} else {
							logger.error('Error authenticating user:', error);
							return reject(err);
						}
					});
				});
			}

			/** Modified version of Firebase's authWithOAuthPopup function that handles presence
    * @memberOf Fireadmin#
    * @param {String} provider - Login data of new user. `Required`
    * @param {Function} onSuccess - Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.authWithOAuthPopup('google', function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'authWithOAuthPopup',
			value: function authWithOAuthPopup(provider) {
				var _this12 = this;

				//[TODO] Check enabled login types
				return new Promise(function (resolve, reject) {
					_this12.ref.authWithOAuthPopup(provider, function (error, authData) {
						if (error === null) {
							// user authenticated with Firebase
							logger.log({ description: 'Auth popup responded.', authData: authData, id: authData.uid, provider: authData.provider, func: 'authWithOAuthPopup', obj: 'Fireadmin' });
							// Manage presence
							_this12.setupPresence(authData.uid);
							// [TODO] Check for account/Add account if it doesn't already exist
							return resolve(authData);
						} else {
							logger.error('Error authenticating user:', error);
							return reject(error);
						}
					});
				});
			}
		}, {
			key: 'newUserFromAnonyomous',
			value: function newUserFromAnonyomous() {}

			/** Log in with Github through OAuth
    * @memberOf Fireadmin#
    * @param {Function} onSuccess - Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.githubAuth(function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'githubAuth',
			value: function githubAuth() {
				return this.authWithOAuthPopup('github');
			}

			/** Modified version of Firebase's authWithPassword that handles presence
    * @memberOf Fireadmin#
    * @param {Function} onSuccess Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.githubAuth(function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'googleAuth',
			value: function googleAuth() {
				return this.authWithOAuthPopup('google');
			}

			/** Modified version of Firebase's authWithPassword that handles presence
    * @memberOf Fireadmin#
    * @param {Function} onSuccess Function that runs when the user is successfully authenticated with presence enabled. `Optional`
    * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
    * @example
    * // Signin User with email and password
    * fb.githubAuth(function(auth){
    *  logger.log('Login Successful for user:', auth.uid);
    * }, function(err){
    *  logger.error('Error logging in:', err);
    * });
    */
		}, {
			key: 'twitterAuth',
			value: function twitterAuth() {
				return this.authWithOAuthPopup('twitter');
			}

			/** Get account for a user given their uid.
    * @memberOf Fireadmin#
    * @param {String} uid Unique Id for account.
    * @param {Function} onSuccess Function that returns account info once it is loaded. `Optional`
    * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
    * @example
    * // Get account for uid: simplelogin:1
    * fa.accountByUid('simplelogin:1', function(account){
    *   logger.log('Account for user with uid: ' + uid + ' is : ', account);
    * }, function(err){
    *    logger.error('Error getting account for ' + uid + ' : ', err);
    * });
    *
    */
		}, {
			key: 'accountByUid',
			value: function accountByUid(uid) {
				var _this13 = this;

				return new Promise(function (resolve, reject) {
					_this13.ref.child(uid).on('value', function (accountSnap) {
						resolve(accountSnap.val());
					}, function (err) {
						logger.error({ description: 'Error getting account by UID.', uid: uid, error: err, func: 'accountByUid', obj: 'Fireadmin' });
						reject(err);
					});
				});
			}

			/** Get user account that is associated to a given email.
    * @memberOf Fireadmin#
    * @param {String} email - Email of account to retreive.
    * @param {Fireadmin~accountByEmailCb} onSuccess - Function that returns account info once it is loaded. `Optional`
    * @param {Fireadmin~errorCb} onError - Function that runs if there is an error. `Optional`
    * @example
    * fa.accountByEmail('test@test.com', function(account){
    *   logger.log('Account loaded:' + account);
    * }, function(err){
    *  logger.error('Error getting account by email:', err);
    * });
    *
    */
		}, {
			key: 'accountByEmail',
			value: function accountByEmail(email) {
				if (email && typeof email == 'string') {
					return this.ref.child('users').orderByChild('email').equalTo(email).on('value', function (querySnapshot) {
						logger.log('accountByEmail returned:', querySnapshot.val());
						return Promise.resolve(querySnapshot.val());
					}, function (err) {
						logger.error('Error getting account by email:', err);
						return Promise.reject(err);
					});
				} else {
					return Promise.reject({ message: 'Email is required to get account.' });
				}
			}

			/**
    * Success callback for accountByEmail function that returns the account associated with a provided email.
    * @callback Fireadmin~accountByEmailCb
    * @param {Object} account Account associated with provided email.
    * @param {String} account.email Email associated with account.
    * @param {String} account.createdAt UTC Time when the account was created.
    */

			/** Start presence management for a specificed user uid. This function is used within Fireadmin login functions.
    * @memberOf Fireadmin#
    * @param {String} uid Unique Id for user that for which presence is being setup.
    * @example
    * fa.setupPresence('simplelogin:1');
    *
    */
		}, {
			key: 'setupPresence',
			value: function setupPresence(uid) {
				var _this14 = this;

				logger.log({ description: 'setupPresence called', uid: uid, func: 'setupPresense', obj: 'Fireadmin' });
				var amOnline = this.ref.child('.info/connected');
				var onlineRef = this.ref.child('presence').child(uid);
				var sessionsRef = this.ref.child('sessions');
				var userRef = this.ref.child('users').child(uid);
				var userSessionRef = this.ref.child('users').child(uid).child('sessions');
				var pastSessionsRef = userSessionRef.child('past');
				return amOnline.on('value', function (snapShot) {
					if (snapShot.val()) {
						//user is online
						var onDisconnectRef = _this14.ref.onDisconnect();
						// add session and set disconnect
						var session = sessionsRef.push({ began: Firebase.ServerValue.TIMESTAMP, user: uid });
						var endedRef = session.child('ended');
						endedRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
						//add correct session id to user
						// adding session id to current list under user's session
						var currentSesh = userSessionRef.child('current').push(session.key());
						// Remove session id from users current session folder
						currentSesh.onDisconnect().remove();
						// remove from presence list
						onlineRef.set(true);
						onlineRef.onDisconnect().remove();
						// Add session id to past sessions on disconnect
						// pastSessionsRef.onDisconnect().push(session.key());
						// Do same on unAuth
						_this14.onAuth(function (authData) {
							if (!authData) {
								endedRef.set(Firebase.ServerValue.TIMESTAMP);
								currentSesh.remove();
								onlineRef.remove();
							}
						});
					}
				});
			}

			/** Get a firebase reference for a path in array | string form
    *
    * @memberOf Fireadmin#
    * @param {String|Array} path relative path to the root folder in Firebase instance
    * @returns A Firebase instance
    * @example
    * //Array as path
    * var userRef = fa.fbRef(['users', uid]);
    */
		}, {
			key: 'fbRef',
			value: function fbRef(path) {
				var ref = this.ref;
				var args = Array.prototype.slice.call(arguments);
				if (args.length) {
					//[TODO] Have this return a Fireadmin object
					ref = ref.child(pathRef(args));
				}
				return ref;
			}
		}, {
			key: 'auth',
			get: function get() {
				return this.ref.getAuth();
			}
		}, {
			key: 'isAuthorized',
			get: function get() {
				return !this.auth || this.auth === null;
			}
		}]);

		return Fireadmin;
	})();

	;
	/**
 	* Extracts an app name out of a Firebase url
 	* @function AppNameFromUrl
 	* @param {String} authData Login data of new user
 	* @returns {String} appName App name extracted from url
 	*/
	function AppNameFromUrl(url) {
		//remove https:// from beginging and .firebaseio.com from the end
		return url.match(/^(?:https?|ftp)?:\/\/([A-Za-z0-9\-]{0,61}[A-Za-z0-9])?/)[1];
	}
	/** Makes a post request to the Fireadmin API
 * @function apiRequest
 * @param {String} path - Path of request within api. `Required`
 * @param {Object} data - Data to include in post request. `Required`
 * @param {Function} onSuccess Function that runs when request has completed successfully. `Optional`
 * @param {Fireadmin~errorCb} onError Function that runs if there is an error. `Optional`
 * @example
 * // Request to /upload with image object
 * apiRequest('upload', {img:imgObj}, function(res){
 *  console.log('Api request to upload completed successfully', res);
 * }, function(err){
 *  console.error('Error requesting to upload:', err);
 * });
 */
	function apiRequest(reqLocation, reqData, successCb, errorCb) {
		console.log('apiRequest sending to ' + reqUrl + ' ...');
		//goog.net.XhrIo.send(url, callback, method, content, headers)
		//  goog.net.XhrIo.send(reqUrl, function(e){
		// 	 if(e.target.isComplete() && e.target.isSuccess()){
		// 		 var res = e.target.getResponse();
		// 		 console.log('apiRequest responded:', res);
		// 		 //Check for existance of response, that it has content, and that content contains a property 'url'
		// 		 if(res){
		// 			 //Save image object to firebase that includes new image url
		// 			 handleCb(successCb, res);
		// 		 } else {
		// 			 console.error('Server error');
		// 			 handleCb(errorCb, {code:'SERVER_ERROR'});
		// 		 }
		// 	 } else {
		// 		 handleCb(errorCb, e.target.getLastError());
		// 	 }
		//  }, 'POST', reqData);
	}
	/** Create a new user profile under 'users'
 * @function createUserProfile
 * @param {Object} authData - Login data of new user. `Required`
 * @param {Reference} ref - Main reference to create profile on. `Required`
 * @param {Function} onSuccess - Function that runs when profile has been created sucessfully. `Optional`
 * @param {Fireadmin~errorCb} - onError Function that runs if there is an error. `Optional`
 * @example
 * // Create a new user profile
 * createUserProfile({email:test@test.com, password:'testtest'}, fa.ref, function(auth){
 *  console.log('Profile created successfully for user:', auth.uid);
 * }, function(err){
 *  console.error('Error creating user profile:', err);
 * });
 */
	function createUserProfile(authData, ref) {
		console.log('createUserAccount called:', arguments);
		var userRef = ref.child('users').child(authData.uid);
		var userObj = { role: 10, provider: authData.provider };
		if (authData.provider == 'password') {
			userObj.email = authData.password.email;
		} else {
			console.log('create 3rd party linked profile:', authData);
			_.extend(userObj, authData);
		}
		//Check if account with given email already exists
		return ref.child('users').orderByChild('email').equalTo(userObj.email).on('value', function (userQuery) {
			if (!userQuery.val()) {
				//Account with given email does not already exist
				userRef.once('value', function (userSnap) {
					if (userSnap.val() == null || userSnap.hasChild('sessions')) {
						userObj.createdAt = Firebase.ServerValue.TIMESTAMP;
						// [TODO] Add check for email before using it as priority
						return userRef.setWithPriority(userObj, userObj.email, function (err) {
							if (!err) {
								console.log('New user account created:', userSnap.val());
								return Promise.resolve(userSnap.val());
							} else {
								return Promise.reject({ message: 'Error creating user profile' });
							}
						});
					} else {
						console.error('User account already exists', userSnap.val());
						return Promise.reject(userSnap.val());
					}
				});
			} else {
				// console.warn('Account already exists. Session must have been added already:', JSON.stringify(userQuery.val()));
				// successCb(userQuery.val());
				var error = { message: 'This email has already been used to create an account', account: JSON.stringify(userQuery.val()), status: 'ACCOUNT_EXISTS' };
				return Promise.reject(error);
			}
		}, function (err) {
			//Error querying for account with email
			return Promise.reject(err);
		});
	};

	return Fireadmin;
});
//# sourceMappingURL=fireadmin.js.map
