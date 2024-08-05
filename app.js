const express = require("express");
const app = express();
const path = require("path");
const Listing = require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const {listingSchema, reviewSchema} = require("./schema.js");

// method over rider
const methodOverride = require('method-override');
app.use(methodOverride("_method"));

// mongoose setup 
const mongoose = require("mongoose");
main().then(res=>{console.log("DB connected...")}).catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

//EJS-Mate
const ejsMate = require("ejs-mate");
app.engine("ejs", ejsMate);

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "/public")));


// HOME Route
app.get("/", (req, res)=>{
    res.send("hi im po");
});


const validateListing = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}


const validateReview = (req,res,next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    }else{
        next();
    }
}

// -------------  Index Route  ---------------
app.get("/listings", wrapAsync(async (req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
}));



// -------------  New Listing Route  ---------------
app.get("/listings/new", (req,res)=>{
    res.render("listings/new.ejs");
});



// -------------  Show Route  ---------------
app.get("/listings/:id", wrapAsync( async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", {listing});
})
);


// -------------  Create Route  ---------------
app.post("/listings", wrapAsync(async (req,res, next)=>{
        let result = listingSchema.validate(req.body);
        console.log(result);
        if(result.error){
            throw new ExpressError()
        }
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
})
);


// Edit Route  
app.get("/listings/:id/edit", wrapAsync( async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
})
);


// UPDATE Route
app.put("/listings/:id", wrapAsync( async (req,res)=>{
    if(!req.body.listing){
        throw new ExpressError(400, "Send valid data for listing");
    }
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
})
);


// DELETE Route
app.delete("/listings/:id", wrapAsync( async(req,res)=>{
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(deleteListing);
    res.redirect("/listings");
})
);


// Reviews Post Rout
app.post("/listings/:id/reviews",validateReview, wrapAsync(async (req, res)=>{
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("new review saved...");
    res.redirect(`/listings/${req.params.id}`);
}));


app.all("*", (req, res, next)=>{
    next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next)=>{
    let {statusCode=500, message="something went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs", {err});
});



app.listen(8080, ()=>{
    console.log("server is listening on port 8080");
});
