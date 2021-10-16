const { Schema, model } = require('mongoose');

const PlannerSchema = new Schema({
    belonging: String,    //belonging = teamid
    author: String,
    title: String,
    discription: String,
    bookmark: Boolean,
});

const Planner = model('planner', PlannerSchema);
module.exports = Planner;