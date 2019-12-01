var express = require("express");
var router = express.Router();
var Lot = require("../models/lot");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var Review = require("../models/review");
var Comment = require("../models/comment");
var multer = require("multer");
var cloudinary = require("cloudinary");
 
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: "AIzaSyAe1yAyaNzM1pyf5R2gL4ET-C8retgt1JY",
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

// ============ Image upload ============
var storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

cloudinary.config({
  cloud_name: "jmspos",
  api_key: "755834234492745",
  api_secret: "P7GJcVWlVYVLKgprCTsUxhRJqTE"
});


//======================================================================

//FUSSY SEARCH BAR FEATURE

//======================================================================

// Regex sanitizer function
const escapeRegex = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// Index
router.get('/', (req, res) => {
  // search was used
  if (req.query.search) {
    let regex = new RegExp(escapeRegex(req.query.search), 'gi');
    Lot.find({name: regex}, (err, lots) => {
      if (err || !lots) {
        req.flash('error', 'There was a problem with the search.');
      }
      // if no results found, send a message to display in the view
      let message = 'Couldn\'t find a matching campround name.';
      lots.length === 0
        ? res.render('lots/index', {lots: lots, currentPage: 'lots', searchMessage: message})
        : res.render('lots/index', {lots: lots, currentPage: 'lots'});
    });
  } else {
  // get all lot listings from DB
    Lot.find({}, (err, lots) => {
      if (err) {
        throw err;
      } else {
        res.render('lots/index', {lots: lots, currentPage: 'lots'});
      }
    });
  }
});


//======================================================================

//INDEX - SHOWS ALL LOT LISTINGS
//route app Lot Listing page

//======================================================================
router.get("/", function(req, res){
	//get all lot listings from DB
	Lot.find({}, function(err, allLots){
		if(err){
			console.log(err);
		} else {
			res.render("lots/index", {lots: allLots, page: "lots"});
		}
	});
});

//=====================================================================

//CREATE - ADD NEW LOTS to DATABASE
//posting new Lots Listing function

//=====================================================================

router.post("/", middleware.isLoggedIn, upload.single("imageLocal"), function(req, res){
	//get data from form and add to lots listing array
	var name = req.body.name;
	var age = req.body.age;
	var price = req.body.price;
	var type_items = req.body.type_items;
	var gender = req.body.gender;
	var postal_code = req.body.postal_code;
	var image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	//geocoding code starts/modified
	geocoder.geocode(req.body.location, function (err, data){
    if (err || !data.length) {
      req.flash("error", "Invalid address");
      return res.redirect("back");
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    //if cloudinary
    //cloudinary
    if (req.file) {
      cloudinary.v2.uploader.upload(req.file.path, { transformation: [
        { width: 2048 }]}, (err, result) => {
        if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
        // add cloudinary image props
        image = {
          id: result.public_id,
          url: result.secure_url
        }
        //cloudinary ends
         Lot.create({name, age, type_items, gender, postal_code, price, image, description, location, lat, lng, author}, (err, lot) => {
          if (err) {
            req.flash("error", "Couldn\'t add Lot Listing.");
          } else {
            req.flash("success", "Lot Listing added successfully.");
          }
          res.redirect("/lots");
        });
      });
    } else { (console.log("no file to upload!!")); }
  });
});
   //geocoding code added /ends
	//var newCampgrounds = {name: name, price: price, image: image,
	//					  description: description, author: author, location: location, lat: lat,lng: lng};
	// Create a new campground and save to DB
	//Campground.create(newCampgrounds, function(err, newlyCreated){
	//	if(err){
	//		console.log(err);
	//	} else {
	//		//redirect back to campgrounds page
	//		console.log(newlyCreated);
	//		res.redirect("/campgrounds");	
	//	}
	//});
 // });
//});

		

//=====================================================================

//NEW - SHOW form to create new Lots

//=====================================================================

router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("lots/new");	
});

//SHOW - shows more info about one lots
router.get("/:id", function(req, res){
	//find the lot listing with provided ID/addred reviews populate function
	Lot.findById(req.params.id).populate("comments").populate("likes").populate({
		path: "reviews",
		options: {sort: {createdAt: -1}}
	}).exec(function(err, foundLot){
		if(err || !foundLot){
			req.flash("error", "Campground not Found!");
			res.redirect("back");
		} else {
			console.log(foundLot);
			//render show template with that Lots Listing
			res.render("lots/show", {lots: foundLot});
		}
	});
});

//=======================================================================

//EDIT LOTS ROUTE

//=======================================================================

router.get("/:id/edit", middleware.checkLotOwnership, function(req, res){
		Lot.findById(req.params.id, function(err, foundLot){
		  res.render("lots/edit", {lot: foundLot});
		});
});

//========================================================================

//UPDATE LOTS ROUTE

//========================================================================
//router.put("/:id", middleware.checkCampgroundOwnership, function(req, res){
	// find and update the correct campground
//	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
//		if(err){
//			res.redirect("/campgrounds");
//		}else {
//			// redirect somwhere (show page)
//			res.redirect("/campgrounds/" + req.params.id);
//		}
//	});
//});
//new code below google maps if bugs remove
router.put("/:id", middleware.checkLotOwnership, upload.single("imageLocal"), function(req, res){
    geocoder.geocode(req.body.location, (err, data) => {
    if (err || data.length === 0) {
      req.flash('error', 'Invalid location');
      return res.redirect("/lots/" + req.params.id + "/edit");
    }
    let updateData = {
      name: req.body.name,
      age: req.body.age,
      price: req.body.price,
      gender: req.body.gender,
      types_items: req.body.types_items,
      postal_code: req.body.postal_code,
      description: req.body.description,
      location: data[0].formattedAddress,
      lat: data[0].latitude,
      lng: data[0].longitude
    };
    // new file update, upload to cloudinary and delete old one
    if (req.file) {
      cloudinary.v2.uploader.upload(req.file.path, {transformation: [{ width: 2048 }]}, (err, result) => {
        if (err) {
          req.flash('error', err.message);
          return res.redirect('back');
        }
        // update cloudinary image props
        updateData.image = {
          id: result.public_id,
          url: result.secure_url
        }
        // delete old picture
        //cloudinary.v2.uploader.destroy(req.lots.image.id, (err, result) => console.log(result));
        // save campground
        Lot.findByIdAndUpdate(req.params.id, {$set: updateData}, (err, lot) => {
          if (err) {
            req.flash('error', 'Couldn\'t update Lot Listing.');
          } else {
            req.flash('success', 'Lot Listing updated successfully.');
          }
          res.redirect("/lots/" + lot._id); // or req.params.id
        });
      });// cloudinary
    } else { // no new file to upload
      // save lot listing
      Lot.findByIdAndUpdate(req.params.id, {$set: updateData}, (err, lot) => {
        if (err) {
          req.flash('error', 'Couldn\'t update Lot Listing.');
        } else {
          req.flash('success', 'Lot Listing updated successfully.');
        }
        res.redirect("/lots/" + lot._id); // or req.params.id
      });
    } 
  });// geocoder
});
  //geocoder.geocode(req.body.location, function (err, data) {
    //if (err || !data.length) {
      //req.flash('error', 'Invalid address');
      //return res.redirect('back');
    //}
    //req.body.campground.lat = data[0].latitude;
    //req.body.campground.lng = data[0].longitude;
    //req.body.campground.location = data[0].formattedAddress;

    //Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, campground){
        //if(err){
            //req.flash("error", err.message);
            //res.redirect("back");
        //} else {
            //req.flash("success","Successfully Updated!");
            //res.redirect("/campgrounds/" + campground._id);
        //}
    //});
  //});
//});


//========================================================================

//Lot Listings Like Route

//========================================================================
// Lot Like Route Starts
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Lot.findById(req.params.id, function (err, foundLot) {
        if (err) {
            console.log(err);
            return res.redirect("/lots");
        }

        // check if req.user._id exists in foundLot.likes
        var foundUserLike = foundLot.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundLot.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundLot.likes.push(req.user._id);
        }

        foundLot.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/lots");
            }
            return res.redirect("/lots/" + foundLot._id);
        });
    });
});
// Like Route Ends

//========================================================================

//DESTROY Lot Listing ROUTE

//========================================================================
//new code if doesn't work remove add this back
//router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
//	Campground.findByIdAndRemove(req.params.id, function(err){
//		if(err){
//			res.redirect("/campgrounds");
//		}else {
//			res.redirect("/campgrounds");
//		}
//	});
//});
router.delete("/:id", middleware.checkLotOwnership, function (req, res) {
    Lot.findById(req.params.id, function (err, lot) {
        if (err) {
            res.redirect("/lots");
        } else {
            // deletes all comments associated with the lots listings
            Comment.remove({"_id": {$in: lot.comments}}, function (err) {
                if (err) {
                    console.log(err);
                    return res.redirect("/lots");
                }
                // deletes all reviews associated with the lot listings
                Review.remove({"_id": {$in: lot.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/lots");
                    }
                    //  delete the lots review
                    lot.remove();
                    req.flash("success", "Lot Review deleted successfully!");
                    res.redirect("/lots");
                });
            });
        }
    });
});


//exports code for router exports
module.exports = router;