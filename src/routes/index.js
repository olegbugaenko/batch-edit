const BatchEditModule = require('@modules/batch-edit');

module.exports = (app) => {
    app.post('/batch',async (req, res) => {
        try{
            const results = await BatchEditModule.bulkActions(req.body);
            res.send(results);
        } catch (e) {
            res.status(400);
            res.send(e.message);
        }
    })
}
