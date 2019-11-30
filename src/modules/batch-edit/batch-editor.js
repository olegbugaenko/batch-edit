const EventEmitter = require('events');
const HttpRequest = require('./http-request');

/**
 * BatchEditor - class that handles running requests step by step, depending on restrictions
 * of how much requests we can send per some unit time
 */

class BatchEditor extends EventEmitter {

    #endpoint;
    #requests;
    #results;
    #checkInterval;
    #payloads;
    #runnedThisPeriod;

  /**
     *
     * @param endpoint - Object, containing request url and verb. Ex: {url: "http://www.some-service.ai/services", verb: "post"}
     * @param payloads - Array, containing objects with request parameters and bodies
     */
  constructor({
    endpoint,
    payloads,
  }, {
    maxRequests,
    maxRequestsTimeUnit,
    maxRetries,
  }) {
    super();
    this.#endpoint = endpoint;
    this.#payloads = payloads;
    this.#results = [];
    this.maxRequests = maxRequests;
    this.maxRetries = maxRetries;
    this.maxRequestsTimeUnit = maxRequestsTimeUnit;

    // Creating request object for each payload

    this.#requests = payloads
      .map((payload) => new HttpRequest({
        url: Object
            .entries(payload.pathParameters)
            .reduce((pathTemplate, [key, value]) => pathTemplate.replace(`\${${key}}`, value), this.endpointPath),
        verb: this.#endpoint.verb,
        body: payload.requestBody,
      }, {
        maxRetries,
      }));
    this.#runnedThisPeriod = 0;
    if (this.maxRequests) {
      this.#checkInterval = setInterval(() => {
        this.#runnedThisPeriod = 0;
        this.nextRequests();
      }, this.maxRequestsTimeUnit * 1000);
    }

    // this.runRequests();
  }

  /**
     * Get endpoint path
     * @returns String, request url
     */
  get endpointPath() {
    return this.#endpoint.url;
  }

  /**
     * Calculates amount of queries that still waiting in queue
     * @returns {number}
     */
  get waitingCount() {
    return this.#requests.filter((req) => req.started === false).length;
  }

  get totalSuccessfull() {
    return this
      .#requests
      .filter((req) => req.finished === true && req.result && req.result.success).length;
  }

  get totalFailed() {
    return this
      .#requests
      .filter((req) => req.finished === true && req.result && !req.result.success).length;
  }

  /**
     * Calculates amount of queries that can be executed. It should be amount, that
     * can be launched according to max. queries per time unit restriction, but obviously
     * not more than total remaining
     * @returns {number}
     */
  get executableAmount() {
    if (this.maxRequests <= 0) return this.waitingCount;

    return Math.min(this.waitingCount, this.maxRequests - this.#runnedThisPeriod);
  }

  /**
     * Checks if all requests vere compleded with maximum amount of retries
     * @returns {boolean}
     */

  get allFinished() {
    return this
      .#requests
      .filter((req) => req.finished === false)
      .length === 0;
  }

  /**
     * Launch next pack of requests once they are still present
     */

  nextRequests() {
    if (this.allFinished) {
        clearInterval(this.#checkInterval);
      this.emit('finished', this.#requests.map((req) => req.result));
      return;
    }
    if (this.executableAmount <= 0) {
      return;
    }

    // This logic is implemented for proper handling cases
    // if different queries have significantly different execution time
    // We don't need wait for all pack to complete. Once one query completed
    // faster than others - just check if can run another one, and run it
    this.#requests
      .filter((req) => req.finished === false && req.started === false) // Select queries that still waiting for execution
      .slice(0, this.executableAmount) // slice amount that we can perform
      .map((item) => {
        this.#runnedThisPeriod++; // increment amount of queries per this time interval
        return item
          .run() // run request
          .then((data) => this.handleSuccess(data)) // call success handler
          .catch((err) => console.error('err: ', err.message)); // something unpredicted happened
      });
  }

  /**
     * Handler for succesfully completed request
     * Emits event once we need to track somewhere outside of class completion of request
     * And running next available pack of requests
     * @param data
     * @returns {*}
     */

  handleSuccess(data) {
    this.emit('fetchDone', {
      total: {
        success: this.totalSuccessfull,
        failed: this.totalFailed,
        remaing: this.waitingCount,
      },
      result: data,
    }); // emit event, that can be handled somewhere outside to monitor progress
    return this.nextRequests();
  }

  /**
     * Promise wrapper for everything done event
     * @returns {Promise<any>}
     */

  doActions() {
    this.nextRequests();
    return new Promise((resolve) => {
      this.on('finished', (results) => resolve({
        total: {
          success: this.totalSuccessfull,
          failed: this.totalFailed,
        },
        results,
      }));
    });
  }
}

module.exports = BatchEditor;
