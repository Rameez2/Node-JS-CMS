const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const app = express()
const User = require('./models/users')
const Post = require('./models/posts')
const ejs = require('ejs')
const bcrypt = require('bcryptjs')
const config = require('./config/database')
const passport = require('passport')
// const initializePassport = require('./config/passport')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const flash = require('connect-flash')
const { Passport } = require('passport')
//  Configure Mongoose
// Password : UMh2r34vjSjKhwNI

mongoose.connect(config.database,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })

// 


app.use(flash())
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser('secretcode'))
app.use(session({
    secret:'Thisissecret',
     resave: false,
    saveUninitialized: false,
}))
app.use(express.static(path.join(__dirname,'public/images')))
app.use(express.static(path.join(__dirname, 'views/admin')))
app.use(express.static(path.join(__dirname, 'views/layout')))
app.use(express.static(path.join(__dirname, 'public/static')))

app.set('view engine', 'ejs');

//        PASSPORT

require('./config/passport')(passport)

app.use(passport.initialize())
app.use(passport.session())








app.listen(2000, () => {
    console.log("Listening on Port 2000")
})


//            Routes

function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}





///           USER PROFILE

app.get('/profile',checkAuthenticated, (req, res) => {
    
    User.findOne({_id:req.user._id},(err,user)=>{
        Post.find({postedby:req.user._id},(err,posts)=>{
    res.render('layout/profile',{user:user,posts:posts}) 
        })
         
    })

})




//            INDEX POSTS 


app.get('/', (req, res) => {

    Post.find({}, function (err, posts) {
        res.render("layout/index", { posts })
    })
})


//     Edit Post

app.get('/edit-post/:postid',checkAuthenticated, (req, res) => {
    Post.find({},function(err,posts){
        res.render('layout/edit')
    });
})


app.post('/edit-post/:postid',checkAuthenticated, (req, res) => {
    Post.find({},function(err,posts){

        res.render('layout/edit')

    });

})

//        EDIT POST ROUTE END



app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });



app.get('/admin',checkAuthenticated, (req, res) => {
    console.log('user >> '+req.user);
    User.find({_id:req.user._id}, function (err, admin) {
        // admin.forEach(element => {
        //     console.log(element._id);
        // });

    User.find({}, function (err, data) {
        console.log(`This is DATA {data}`);
        res.render('admin/admin', { users:data,admin:admin})

    });
 });


})



 

app.get('/admin/showposts',checkAuthenticated, (req, res) => {
    User.find({_id:req.user._id}, function (err, admin) {
    Post.find({},function(err,posts){

        res.render('admin/showposts.ejs', {posts:posts,admin:admin })

    });
});

})




////////////////    DELETE USERS


app.delete('/user/:userid',checkAuthenticated, function (req, res) {
    let id = req.params.userid
    console.log('This is Delete Request');
    User.deleteOne({ _id: req.params.userid }).then((result) => {
        res.status(200).json(result)
    }).catch((err) => {
        console.warn(err)
    })
    console.log("User Deleted Successfully")
})


//////////      DELETE POSTS


app.delete('/delpost/:postid',checkAuthenticated, function (req, res) {
    let id = req.params.postid
    console.log('This is Delete Request');
    Post.deleteOne({ _id: req.params.postid }).then((result) => {
        res.status(200).json(result)
    }).catch((err) => {
        console.warn(err)
    })
    console.log("Post Deleted Successfully")
})







//              UPLOAD POSTS

app.get('/upload-post',checkAuthenticated, (req, res) => {

    let d = new Date()
    date = `${d.getDay()}/${d.getMonth()}/${d.getFullYear()}`

    console.log(date);

    res.render("admin/post-upload")

})


app.post('/upload-post',checkAuthenticated, (req, res) => {
    slug = ''
    for (let i = 0; i < 10; i++) {
        let randomNum = Math.floor(Math.random() * 10)
        slug += randomNum
    }
    console.log(slug);

    let d = new Date()
    date = `${d.getDay()}/${d.getMonth()}/${d.getFullYear()}`
    console.log(date);

    Post.findOne({ slug: slug }, function (err, post) {
        if (post) { console.log('Post Exists'); }
        else {

            postdata = {
                title: req.body.title,
                subtitle: req.body.subtitle,
                content: req.body.content,
                postedby: req.user._id
            }
            console.log(postdata.title);
            console.log(req.user_id);
            uploadPost(postdata.title, postdata.subtitle, postdata.content, postdata.postedby, slug, date)



        }

        //           Condition End

    })



    let uploadPost = (title, subtitle, content, postedby, slug, date) => {
        let newPost = new Post({
            _id: mongoose.Types.ObjectId(),
            title: title,
            subtitle: subtitle,
            content: content,
            postedby: postedby,
            slug: slug,
            date, date
        })
        newPost.save().then((result) => {
            console.log(result)
        })
        res.send("Post Uploaded")

    }

})



//              SHOW SELECTED POST DATA

app.get('/post/:slug', (req, res) => {

Post.find({slug:req.params.slug},(err, post) =>{
        if(err){console.log(err);}
        else{
           
        // console.log(typeof(post));
        res.render("admin/post",{post})
    }

})
}) 



app.get('/signup', (req, res) => {

    res.render('layout/signup')

})

app.post('/signup', (req, res) => {
    let data = { name: req.body.name, email: req.body.email, password: req.body.password }

    //             Check If User Already Registered or Not                   


    let registerNewUser = (name, email, password) => {

        let newUser = new User({
            _id: mongoose.Types.ObjectId(),
            name: name,
            email: email,
            password: password,
        })
        newUser.save().then((result) => {
            console.log(result)
        })
        res.send("Registered")

    }



    emailExists = User.findOne({ email: req.body.email }, function (err, users) {
        if (err) { console.log(err) }        //   IF Error Show Error Message on Server Side
        else if (users) {                  // IF User Already Exists Do not register User
            console.log('Email Already Exists');
            res.send("User Already Exists")
        }
        else {                            // IF User Does Not Already Registered >> Register User

            bcrypt.genSalt(10,function(err,salt){
                bcrypt.hash(data.password,salt,function(err,hash){
                    if(err){console.log(err);}
                    var hashedpassword = hash
                    console.log(hashedpassword);
    
                    registerNewUser(data.name, data.email, hashedpassword)
            })
        })



        
    }})


})






app.get('/login',LoggedIn,(req,res)=>{

    res.render('layout/login')

})


app.post('/login',passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect:'/login',
    failureFlash:true
}),(req,res,next)=>{
  
    res.redirect('/login')

    
})




function LoggedIn(req,res,next){
    if (!req.isAuthenticated()) {
        return next()
      }
      res.redirect('/profile')
}



