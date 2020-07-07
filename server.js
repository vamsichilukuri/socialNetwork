var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var formidable = require("express-formidable");
app.use(formidable());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require("http").createServer(app);
// var bcrypt = require("bcrypt");
var fileSystem = require("fs");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret2424";

// giving access to all users how req to this server
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

// giving access to all users how req to this server
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

socketIO.on("connection", (socket) => {
  // console.log(socket.id);
  // console.log("User Connected", socket.id);
  socketID = socket.id;
});

let port = process.eventNames.PORT || 3000;

http.listen(port, () => {
  // console.log("Server Started");
  app.get("/", (req, res) => {
    res.render("index");
  });
});

const MongoClient = require("mongodb").MongoClient;
const uri =
  "mongodb+srv://social:social@socialnetwork.lrsx9.mongodb.net/<dbname>?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect((err) => {
  var database = client.db("social_network");
  // perform actions on the collection object
  // client.close();
  // });

  // mongoClient.connect("mongodb://localhost:27017", (err, client) => {
  //   var database = client.db("social_network");
  //   console.log("Database connected..");

  // SIGNUP Users GET and POST Req

  app.get("/signup", (req, res) => {
    res.render("signup");
  });

  app.post("/signup", (req, res) => {
    var name = req.fields.name;
    var username = req.fields.username;
    var email = req.fields.email;
    var password = req.fields.password;
    var gender = req.fields.gender;

    database.collection("users").findOne(
      {
        $or: [{ email: email }, { username: username }],
      },
      function (error, user) {
        if (user == null) {
          database.collection("users").insertOne(
            {
              name: name,
              username: username,
              email: email,
              password: password,
              gender: gender,
              profileImage: "",
              coverPhoto: "",
              dob: "",
              city: "",
              country: "",
              aboutMe: "",
              friends: [],
              pages: [],
              notifications: [],
              groups: [],
              posts: [],
            },
            function (error, data) {
              res.json({
                status: "success",
                message: "Signup successfully. you can login now",
              });
            }
          );
        } else {
          res.json({
            status: "error",
            message: "Error or Username already exist",
          });
        }
      }
    );
  });

  // LOGIN Api GET and POST
  app.get("/login", (req, res) => {
    res.render("login");
  });

  //post req
  app.post("/login", (req, res) => {
    var email = req.fields.email;
    var password = req.fields.password;
    database.collection("users").findOne(
      {
        email: email,
        password: password,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "Email does not exist",
          });
        }
        if (user) {
          var accessToken = jwt.sign(
            { email: email, password: password },
            accessTokenSecret
          );
          database.collection("users").findOneAndUpdate(
            {
              email: email,
              password: password,
            },
            {
              $set: {
                accessToken: accessToken,
              },
            },
            (error, data) => {
              res.json({
                status: "success",
                message: "Login Successfully",
                accessToken: accessToken,
                profileImage: user.profileImage,
              });
            }
          );
          // } else {
          //   res.json({
          //     status: "error",
          //     message: "Password is not correct",
          //   });
          // }
        }
      }
    );
  });

  //Update Userprofile GET and POST req
  app.get("/updateProfile", (req, res) => {
    res.render("updateProfile");
  });
  //Update Userprofile GET and POST req
  app.post("/getUser", (req, res) => {
    var accessToken = req.fields.accessToken;
    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out.",
          });
        } else {
          res.json({
            status: "success",
            message: "Record has been fetched",
            data: user,
          });
        }
      }
    );
  });
  //logout
  app.get("/logout", (req, res) => {
    res.redirect("/login");
  });

  //UPLOAD COVERPHOTO
  app.post("/uploadCoverPhoto", async (req, res) => {
    var accessToken = req.fields.accessToken;
    var coverPhoto = "";

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please login",
          });
        } else {
          if (
            req.files.coverPhoto.size > 0 &&
            req.files.coverPhoto.type.includes("image")
          ) {
            if (user.coverPhoto != "") {
              fileSystem.unlink(user.coverPhoto, (error) => {
                //
              });
            }
            coverPhoto =
              "public/images/" +
              new Date().getTime() +
              "-" +
              req.files.coverPhoto.name;
            fileSystem.rename(
              req.files.coverPhoto.path,
              coverPhoto,
              (error) => {
                //
              }
            );

            database.collection("users").updateOne(
              {
                accessToken: accessToken,
              },
              {
                $set: {
                  coverPhoto: coverPhoto,
                },
              },
              (error, data) => {
                res.json({
                  status: "status",
                  message: "Cover photo has been updated",
                  data: mainURL + "/" + coverPhoto,
                });
              }
            );
          } else {
            res.json({
              status: "error",
              message: "Please select valid image.",
            });
          }
        }
      }
    );
  });

  //UPLOAD PROFILE PHOTO
  app.post("/uploadProfileImage", (req, res) => {
    var accessToken = req.fields.accessToken;
    var profileImage = "";

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please login again.",
          });
        } else {
          if (
            req.files.profileImage.size > 0 &&
            req.files.profileImage.type.includes("image")
          ) {
            if (user.profileImage != "") {
              fileSystem.unlink(user.profileImage, (error) => {
                //
              });
            }

            profileImage =
              "public/images/" +
              new Date().getTime() +
              "-" +
              req.files.profileImage.name;
            fileSystem.rename(
              req.files.profileImage.path,
              profileImage,
              (error) => {
                //
              }
            );

            database.collection("users").updateOne(
              {
                accessToken: accessToken,
              },
              {
                $set: {
                  profileImage: profileImage,
                },
              },
              (error, data) => {
                res.json({
                  status: "status",
                  message: "Profile image has been updated.",
                  data: mainURL + "/" + profileImage,
                });
              }
            );
          } else {
            res.json({
              status: "error",
              message: "Please select valid image.",
            });
          }
        }
      }
    );
  });

  //UPDATE PROFILE with more details
  app.post("/updateProfile", (req, res) => {
    console.log(req.fields);
    var accessToken = req.fields.accessToken;
    var name = req.fields.name;
    var dob = req.fields.dob;
    var city = req.fields.city;
    var country = req.fields.country;
    var aboutMe = req.fields.aboutMe;

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out, please login.",
          });
        } else {
          database.collection("users").updateOne(
            {
              accessToken: accessToken,
            },
            {
              $set: {
                name: name,
                dob: dob,
                city: city,
                country: country,
                aboutMe: aboutMe,
              },
            },
            (error, data) => {
              res.json({
                status: "status",
                message: "Profile has been Updated",
              });
            }
          );
        }
      }
    );
  });

  //root
  app.get("/", (req, res) => {
    res.render("index");
  });
  //posts
  app.post("/addPost", (req, res) => {
    var accessToken = req.fields.accessToken;
    var caption = req.fields.caption;
    var image = "";
    var video = "";
    var type = req.fields.type;
    var createdAt = new Date().getTime();
    var _id = req.fields._id;

    database
      .collection("users")
      .findOne({ accessToken: accessToken }, (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please login again.",
          });
        } else {
          if (
            req.files.image.size > 0 &&
            req.files.image.type.includes("image")
          ) {
            image =
              "public/images/" +
              new Date().getTime() +
              "-" +
              req.files.image.name;
            fileSystem.rename(req.files.image.path, image, (error) => {
              //
            });
          }
          if (
            req.files.video.size > 0 &&
            req.files.video.type.includes("video")
          ) {
            video =
              "public/videos/" +
              new Date().getTime() +
              "-" +
              req.files.video.name;
            fileSystem.rename(req.files.video.path, video, (error) => {
              //
            });
          }
          database.collection("posts").insertOne(
            {
              caption: caption,
              image: image,
              video: video,
              type: type,
              createdAt: createdAt,
              likers: [],
              comments: [],
              shares: [],
              user: {
                _id: user._id,
                name: user.name,
                profileImage: user.profileImage,
              },
            },
            (error, data) => {
              database.collection("users").updateOne(
                {
                  accessToken: accessToken,
                },
                {
                  $push: {
                    posts: {
                      _id: data.insertedId,
                      caption: caption,
                      image: image,
                      video: video,
                      type: type,
                      createdAt: createdAt,
                      likers: [],
                      comments: [],
                      shares: [],
                    },
                  },
                },
                (error, data) => {
                  res.json({
                    status: "success",
                    message: "Post has been Uploaded Successfully",
                  });
                }
              );
            }
          );
        }
      });
  });
  //news feed
  app.post("/getNewsfeed", (req, res) => {
    var accessToken = req.fields.accessToken;
    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out.Please login again",
          });
        } else {
          var ids = [];
          ids.push(user._id);
          database
            .collection("posts")
            .find({ "user._id": { $in: ids } })
            .sort({ createAt: -1 })
            .limit(5)
            .toArray((error, data) => {
              res.json({
                status: "success",
                message: "Record has been fetched",
                data: data,
              });
            });
        }
      }
    );
  });

  app.post("/toggleLikePost", (req, res) => {
    var accessToken = req.fields.accessToken;
    var _id = req.fields._id;

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User had been logged out. please login again.",
          });
        } else {
          database.collection("posts").findOne(
            {
              _id: ObjectId(_id),
            },
            (error, post) => {
              if (post == null) {
                res.json({
                  status: "error",
                  message: "Post does not exist.",
                });
              } else {
                var isLiked = false;
                for (var v = 0; v < post.likers.length; v++) {
                  var liker = post.likers[v];

                  if (liker._id.toString() == user._id.toString()) {
                    isLiked = true;
                    break;
                  }
                }

                if (isLiked) {
                  database.collection("posts").updateOne(
                    {
                      _id: ObjectId(_id),
                    },
                    {
                      $pull: {
                        likers: {
                          _id: user._id,
                        },
                      },
                    },
                    (error, data) => {
                      database.collection("users").updateOne(
                        {
                          $and: [
                            {
                              _id: post.user._id,
                            },
                            {
                              "posts._id": post._id,
                            },
                          ],
                        },
                        {
                          $pull: {
                            "post.$[].likers": {
                              _id: user._id,
                            },
                          },
                        }
                      );
                      res.json({
                        status: "unliked",
                        message: "Post has been unliked.",
                      });
                    }
                  );
                } else {
                  database.collection("users").updateOne(
                    {
                      _id: post.user._id,
                    },
                    {
                      $push: {
                        notification: {
                          _id: ObjectId(),
                          type: "photo_liked",
                          content: user.name + "has liked your photo",
                          profileImage: user.profileImage,
                          createdAt: new Date().getTime(),
                        },
                      },
                    }
                  );
                  database.collection("posts").updateOne(
                    {
                      _id: ObjectId(_id),
                    },
                    {
                      $push: {
                        likers: {
                          _id: user._id,
                          name: user.name,
                          profileImage: user.profileImage,
                        },
                      },
                    },
                    (error, data) => {
                      database.collection("users").updateOne(
                        {
                          $and: [
                            {
                              _id: post.user._id,
                            },
                            {
                              "post._id": post._id,
                            },
                          ],
                        },
                        {
                          $push: {
                            "posts.$[].likers": {
                              _id: user._id,
                              name: user.name,
                              profileImage: user.profileImage,
                            },
                          },
                        }
                      );
                      res.json({
                        status: "success",
                        message: "Post has been liked",
                      });
                    }
                  );
                }
              }
            }
          );
        }
      }
    );
  });

  //post commments
  app.post("/postComment", (req, res) => {
    var accessToken = req.fields.accessToken;
    var _id = req.fields._id;
    var comment = req.fields.comment;
    var createdAt = new Date().getTime();

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please Login again.",
          });
        } else {
          database.collection("posts").findOne(
            {
              _id: ObjectId(_id),
            },
            function (error, post) {
              if (post == null) {
                res.json({
                  status: "error",
                  message: "Post does not exist",
                });
              } else {
                var commentId = ObjectId();
                database.collection("posts").updateOne(
                  {
                    _id: ObjectId(_id),
                  },
                  {
                    $push: {
                      comments: {
                        _id: commentId,
                        user: {
                          _id: user._id,
                          name: user.name,
                          profileImage: user.profileImage,
                        },
                        comment: comment,
                        createdAt: createdAt,
                        replies: [],
                      },
                    },
                  },
                  function (error, data) {
                    if (user._id.toString() != post.user._id.toString()) {
                      database.collection("users").updateOne(
                        {
                          _id: post.user._id,
                        },
                        {
                          $push: {
                            notifications: {
                              _id: ObjectId(),
                              type: "new_comment",
                              content: user.name + " commented on your post",
                              profileImage: user.profileImage,
                              createdAt: new Date().getTime(),
                            },
                          },
                        }
                      );
                    }
                    database.collection("users").updateOne(
                      {
                        $and: [
                          {
                            _id: post.user._id,
                          },
                          {
                            "posts._id": post._id,
                          },
                        ],
                      },
                      {
                        $push: {
                          "posts.$[].comments": {
                            _id: commentId,
                            user: {
                              _id: user._id,
                              name: user.name,
                              profileImage: user.profileImage,
                            },
                            comment: comment,
                            createdAt: createdAt,
                            replies: [],
                          },
                        },
                      }
                    );
                    res.json({
                      status: "success",
                      message: "Comment has been posted.",
                    });
                  }
                );
              }
            }
          );
        }
      }
    );
  });

  //postReply to comment
  app.post("/postReply", (req, res) => {
    var accessToken = req.fields.accessToken;
    var postId = req.fields.postId;
    var commentId = req.fields.commentId;
    var reply = req.fields.reply;
    var createdAt = new Date().getTime();

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please login again.",
          });
        } else {
          database.collection("posts").findOne(
            {
              _id: ObjectId(postId),
            },
            (error, post) => {
              if (post == null) {
                res.json({
                  status: "error",
                  message: "Post does not exits.",
                });
              } else {
                var replyId = ObjectId();
                database.collection("posts").updateOne(
                  {
                    $and: [
                      {
                        _id: ObjectId(postId),
                      },
                      {
                        "comments._id": ObjectId(commentId),
                      },
                    ],
                  },
                  {
                    $push: {
                      "comments.$.replies": {
                        _id: replyId,
                        user: {
                          _id: user._id,
                          name: user.name,
                          profileImage: user.profileImage,
                        },
                        reply: reply,
                        createdAt: createdAt,
                      },
                    },
                  },
                  function (error, data) {
                    database.collection("users").updateOne(
                      {
                        $and: [
                          {
                            _id: post.user._id,
                          },
                          {
                            "posts._id": post._id,
                          },
                          {
                            "posts.comments._id": ObjectId(commentId),
                          },
                        ],
                      },
                      {
                        $push: {
                          "posts.$[].comments.$[].replies": {
                            _id: replyId,
                            user: {
                              _id: user._id,
                              name: user.name,
                              profileImage: user.profileImage,
                            },
                            reply: reply,
                            createdAt: createdAt,
                          },
                        },
                      }
                    );
                    res.json({
                      status: "success",
                      message: "Reply has been posted.",
                    });
                  }
                );
              }
            }
          );
        }
      }
    );
  });

  //share post
  app.post("/sharePost", (req, res) => {
    var accessToken = req.fields.accessToken;
    var _id = req.fields._id;
    var type = "shared";
    var createdAt = new Date().getTime();

    database.collection("users").findOne(
      {
        accessToken: accessToken,
      },
      (error, user) => {
        if (user == null) {
          res.json({
            status: "error",
            message: "User has been logged out. Please login again",
          });
        } else {
          database.collection("posts").findOne(
            {
              _id: ObjectId(_id),
            },
            (error, post) => {
              if (post == null) {
                res.json({
                  status: "error",
                  message: "Post does not exist.",
                });
              } else {
                database.collection("posts").updateOne(
                  {
                    _id: ObjectId(_id),
                  },
                  {
                    $push: {
                      shares: {
                        _id: user._id,
                        name: user.name,
                        profileImage: user.profileImage,
                      },
                    },
                  },
                  (error, data) => {
                    database.collection("posts").insertOne(
                      {
                        caption: post.caption,
                        image: post.image,
                        video: post.video,
                        type: type,
                        createdAt: createdAt,
                        likers: [],
                        comments: [],
                        shares: [],
                        user: {
                          _id: user._id,
                          name: user.name,
                          gender: user.gender,
                          profileImage: user.profileImage,
                        },
                      },
                      (error, data) => {
                        database.collection("users").updateOne(
                          {
                            $and: [
                              {
                                _id: post.user._id,
                              },
                              {
                                "posts._id": post._id,
                              },
                            ],
                          },
                          {
                            $push: {
                              "posts.$[].sahres": {
                                _id: user._id,
                                name: user.name,
                                profileImage: user.profileImage,
                              },
                            },
                          }
                        );
                        res.json({
                          status: "success",
                          message: "Post has been shared.",
                        });
                      }
                    );
                  }
                );
              }
            }
          );
        }
      }
    );
  });
  //end of db u cant access db outside of this function (function scoope of the variable)
});
