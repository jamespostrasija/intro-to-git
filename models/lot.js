var mongoose = require("mongoose");
var Review = require("./review");
//SCHEMA SETUP DATABASE MODEL.
var lotSchema = new mongoose.Schema({
	name: String,
	image: {
		id: String,
		url: String
	},
	age: String,
	price: String,
	type_items: String,
	description: String,
	gender: String,
	location: String,
	postal_code: String,
	lat: Number,
	lng: Number,
	createdAt: { type: Date, default: Date.now },
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comments"
		}
	],
	likes: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		}
	],
	reviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Review"
		}
	],
	rating: {
		type: Number,
		default: 0
	}
});

//SCHEMA MODE ORIENTATION
module.exports = mongoose.model("Lot", lotSchema);