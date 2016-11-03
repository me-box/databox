var Promise = require('promise');

//local storage of SLA 
var Datastore = require('nedb');
db = new Datastore({filename: './slaStore/sladatastore.db', autoload: true});

//stop more then one SLA being added to the db
db.ensureIndex({fieldName: 'SLAName', unique: true});

exports.getSLA = function (name) {
	return new Promise((resolve, reject) => db.findOne({SLAName: name}, function (err, doc) {
		if (err) {
			reject("[SLA] Error SLA not found: " + err);
			return;
		}
		resolve(doc);
	}));
};

exports.getAllSLAs = function () {
	return new Promise((resolve, reject) => db.find({}, function (err, doc) {
		if (err) {
			reject("[SLA] Error listing SLAs: " + err);
			return;
		}
		resolve(doc);
	}));
};

exports.putSLA = function (name, sla) {
	sla['SLAName'] = name;
	return new Promise((resolve, reject) => db.insert(sla, function (err, doc) {
		if (err) {
			reject("SLA could not be saved" + err);
			return;
		}
		resolve(doc);
	}));
};

exports.deleteSLA = function (name) {
	return new Promise((resolve, reject) => db.remove({SLAName: name}, function (err, doc) {
		if (err) {
			reject("SLA could not be removed" + err);
			return;
		}
		resolve(doc);
	}));
};


exports.dump = function () {
	return new Promise((resolve, reject) => db.find({}, function (err, doc) {
		if (err) {
			reject("Could not dump data" + err);
			return;
		}
		resolve(doc);
	}));
};