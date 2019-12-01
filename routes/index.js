var express = require("express");
var router = express.Router();
var passport = require("passport"); 
var User = require("../models/user");
var Lot = require("../models/lot");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var multer = require("multer");
var cloudinary = require("cloudinary");

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
var upload = multer({ 
  storage: storage, 
  fileFilter: imageFilter 
  
});

cloudinary.config({
  cloud_name: "jmspos",
  api_key: "755834234492745",
  api_secret: "P7GJcVWlVYVLKgprCTsUxhRJqTE"
});

//route app server function
router.get("/", function(req, res){
	res.render("landing");
});


//show the register form
router.get("/register", function(req, res){
	res.render("register", {page: "register"});
});

//=======================================================
//FRONT END PAGES
//==========================================
//show the about page
router.get("/about", function(req, res){
  res.render("about", {page: "about"});
});
//==========================================
//FRONT END PAGES
//==========================================
//show the contact page
router.get("/contact", function(req, res){
  res.render("contact", {page: "contact"});
});
//==========================================
//FRONT END PAGES
//show the terms-of-user page
router.get("/terms-of-use", function(req,res){
  res.render("terms-of-use", {page: "terms-of-use"});
});
//==========================================
//FRONT END PAGES
//show the privacy policy page
router.get("/privacy-policy", function(req, res){
  res.render("privacy-policy", {page: "privacy-policy"});
});
//========================================================
//FRONT END PAGES
//show the robots page
router.get("/robots", function(req, res) {
    res.type("text/plain");
    res.render("robots", {page: "robots"});
});
//========================================================
//FRONT END PAGES
//show the robots page
router.get("/sitemap", function(req, res) {
    res.type("text/html");
    res.render("sitemap", {page: "sitemap"});
});
//========================================================
//FRONT END PAGES
//show the AMP FILE page
router.get("/calgary/toddler-free-toys", function(req, res){
  res.render("calgary/toddler-free-toys", {page: "calgary/toddler-free-toys"});
});
//========================================================


//handle sign up logic
router.post("/register", upload.single("image"), function(req, res){
	//new code
	if (req.file === undefined) {
    var newUser = new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      image: "",
      imageId: ""
    });
    User.register(newUser, req.body.password, function(err, user) {
      if (err) {
        return res.render("register", {
          error: err.message
        });
      }
      passport.authenticate("local")(req, res, function() {
        res.redirect("/lots");
      });
    });
  } else {
    cloudinary.v2.uploader.upload(
      req.file.path, {
        width: 400,
        height: 400,
        gravity: "center",
        crop: "scale"
      },
      function(err, result) {
        if (err) {
          req.flash("error", err.messsage);
          return res.redirect("back");
        }
        req.body.image = result.secure_url;
        req.body.imageId = result.public_id;
        var newUser = new User({
          username: req.body.username,
          email: req.body.email,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          image: req.body.image,
          imageId: req.body.imageId
        });
        User.register(newUser, req.body.password, function(err, user) {
          if (err) {
            return res.render("register", {
              error: err.message
            });
          }
          passport.authenticate("local")(req, res, function() {
            res.redirect("/lots");
          });
        });
      }, {
        moderation: "webpurify"
      }
    );
  }
});
	//new code ends
	//if (req.file === undefined ){
		// var newUser = new User({
		//	username: req.body.username, 
		//	firstName: req.body.firstName,
		//	lastName: req.body.lastName,
		//	email: req.body.email,
		//	image: "",
		//	imageId: ""
	//	});
//	if(req.body.adminCode === "sercetcode") {
		//newUser.isAdmin = true;
	//}
//	User.register(newUser, req.body.password, function(err, user){
		//	req.flash("error", err.message);
			//return res.render("register");
		//}
	//	passport.authenticate("local")(req, res, function(){
		//	req.flash("success", "Welcome to Have Lots Need Lots " + user.username);
		//	res.redirect("/campgrounds");
	//	});
	//});
//});
	
//show login form
router.get("/login", function(req, res){
	res.render("login", {page: "login"});
});

//handing login locic
router.post("/login", passport.authenticate("local", 
		{
			successRedirect: "/lots",
			failureRedirect: "/login"
		}), function(req, res){
	      req.flash("success", "Welcome to Have Lots Need Lots " + User.username);
	});

//logout logic route
router.get("/logout", function(req, res){
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/lots");
});

//USER PROFILES
//router.get("/users/:id", function(req,res){
//	User.findById(req.params.id, function(err, foundUser) {
//		if(err) {
//			req.flash("error", "Something went wrong.");
//			res.redirect("/");
//		}
//		res.render("users/show", {user: foundUser});	
//	});
//});

// user profile
router.get("/users/:user_id", function(req, res) {
  User.findById(req.params.user_id, function(err, foundUser) {
    if (err || !foundUser) {
      req.flash("error", "This user doesn't exist");
      return res.render("error");
    }
    Lot.find()
      .where("author.id")
      .equals(foundUser._id)
      .exec(function(err, lots) {
        if (err) {
          req.flash("error", "Something went wrong");
          res.render("error");
        }
        Comment.find()
          .where("author.id")
          .equals(foundUser._id)
          .exec(function(err, ratedCount) {
            if (err) {
              req.flash("error", "Something went wrong");
              res.render("error");
            }
            res.render("users/show", {
              user: foundUser,
              lots: lots,
              reviews: ratedCount
            });
          });
      });
  });
});


// edit profile
router.get(
  "/users/:user_id/edit",
  middleware.isLoggedIn,
  middleware.checkProfileOwnership,
  function(req, res) {
    res.render("users/edit", {
      user: req.user
    });
  }
);

// update profile
router.put(
  "/users/:user_id",
  upload.single("image"),
  middleware.checkProfileOwnership,
  function(req, res) {
    User.findById(req.params.user_id, async function(err, user) {
      if (err) {
        req.flash("error", err.message);
      } else {
        if (req.file) {
          try {
            await cloudinary.v2.uploader.destroy(user.imageId);
            var result = await cloudinary.v2.uploader.upload(req.file.path, {
              width: 400,
              height: 400,
              gravity: "center",
              crop: "scale"
            }, {
              moderation: "webpurify"
            });
            user.imageId = result.public_id;
            user.image = result.secure_url;
          } catch (err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
        }
        user.email = req.body.email;
        user.phone = req.body.phone;
        user.firstName = req.body.firstName;
        user.lastName = req.body.firstName;
        user.save();
        req.flash("success", "Updated your profile!");
        res.redirect("/users/" + req.params.user_id);
      }
    });
  }
);

// delete user
router.delete("/users/:user_id", middleware.checkProfileOwnership, function(
  req,
  res
) {
  User.findById(req.params.user_id, async function(err, user) {
    if (err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    if (user.image === "") {
      user.remove();
      res.redirect("/");
    } else {
      try {
        await cloudinary.v2.uploader.destroy(user.imageId);
        user.remove();
        res.redirect("/");
      } catch (err) {
        if (err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
      }
    }
  });
});






module.exports = router;