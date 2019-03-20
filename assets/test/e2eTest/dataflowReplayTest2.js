module.exports = require('./baseReplayTest.js').replay(
    {
        user: 'dftest',
        workbook: 'Test-Dataflow-1',
        validation: [
            {dfName: 'DF Test(result)', nodeName: 'validation1'},
            {dfName: 'DF Test(result)', nodeName: 'validation2'},
        ]
    },
    ["workbook replay2",  "allTests"]
);