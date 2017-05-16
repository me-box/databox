


const repoTagToName = function (repoTag) {
	return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];

const repoTagToName = function (repoTag) {
	return repoTag.match(/(?:.*\/)?([^/:\s]+)(?::.*|$)/)[1];
const updateArbiter = async function (data) {
	return new Promise(async (resolve, reject) => {
		console.log("[updateArbiter] DONE");
		const options = {
				url: DATABOX_ARBITER_ENDPOINT + "/cm/upsert-container-info",
				method:'POST',
				form: data,
				agent: arbiterAgent,
				headers: {
					'x-api-key': arbiterKey
				}
			};
			console.log(options);
		request(
			options,
			function (err, response, body) {
				if (err) {
		
		const options = {
				url: DATABOX_ARBITER_ENDPOINT + "/cm/delete-container-info",
				method:'POST',
				form: permissions,
				agent: arbiterAgent,
				headers: {
					'x-api-key': arbiterKey
			};
		request(
			options,
			function (err, response, body) {
				if (err) {
					reject(err);
					return;
				resolve();