const BatchEditor = require('./batch-editor');

module.exports = {
    bulkActions: ({endpoint, payloads}) => {
        if(!endpoint)
            throw new Error('Endpoint object should be specified');

        if(!endpoint.url)
            throw new Error('Endpoint path should be specified');

        if(!endpoint.verb)
            throw new Error('Endpoint verb should be specified');

        const BatchEditRequests = new BatchEditor({endpoint, payloads},{
            maxRequests: process.env.REQUESTS_LIMIT_AMOUNT || 5,
            maxRequestsTimeUnit: process.env.REQUESTS_LIMIT_TIMEUNIT || 10,
            maxRetries: process.env.MAX_RETRIES || 2,
        });

        return BatchEditRequests.doActions();

    },
}
