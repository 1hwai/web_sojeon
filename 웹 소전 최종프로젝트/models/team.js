const { Schema, model } = require('mongoose');

const TeamSchema = new Schema({
    teamname: String,
    ownerid: String,
    managerid: [
        {
            memberid: String,
        },
    ],
    members: [
        {
            memberid: String,
        },
    ],
});

const Team = model('team', TeamSchema);
module.exports = Team;