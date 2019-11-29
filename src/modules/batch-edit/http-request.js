const axios = require('axios');

/****
 * HttpRequest - class, wrapping axios method to add logic of retries
 * and easier request status handling
 */
class HttpRequest
{
    /**
     *
     * @param url - String, accepts the query url with already parsed url path parameters
     * @param verb - String [GET, POST, PUT, DELETE], request method
     * @param body - Object, key-value pairs of JSON request body
     */
    constructor({
        url,
        verb,
        body
    },{
       maxRetries,
    }) {
        this._url = url;
        this._verb = verb;
        this._body = body;
        this.finished = false;
        this.started = false;
        this.result = {};
        this.numRetries = 0;
        this.maxRetries = 2;
    }

    /**
     * Method to run query itself
     * @returns {Promise<any>} - resolves with ref to object context once query fullfilled
     *                           successfully or with error
     */
    run() {
        return new Promise(async (resolve, reject) => {
            this.started = true;
            this.result = null;
            this.numRetries++;
            try {
                const result = await axios({
                    method: this._verb,
                    url: this._url,
                    data: this._body
                });
                this.result = {
                    success: true,
                    numRetry: this.numRetries,
                    data: result.data,
                }
            } catch(e) {
                if(this.numRetries >= this.maxRetries)
                {
                    this.result = {
                        success: false,
                        numRetry: this.numRetries,
                        data: (e.response && {
                            code: e.response.status,
                            text: e.response.statusText,
                        }) || {
                            code: e.errno,
                        }
                    }
                }
                else
                    this.started = false;

            } finally {
                if(this.result) {
                    this.finished = true;
                    return resolve(this);
                }
            }
        })
    }
}

module.exports = HttpRequest;
