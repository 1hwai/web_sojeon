const { Schema, model } = require('mongoose');

const PlanSchema = new Schema({
    belonging: String, //Planner._id
    important: Boolean,
    contents: String,
    shortmemo: String,
});

const Plan = model('plan', PlanSchema);
module.exports = Plan;