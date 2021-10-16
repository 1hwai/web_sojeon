const {Router} = require('express');
const mongoose = require("mongoose");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Team = require('../models/team');
const Planner = require('../models/planner');
const Plan = require('../models/plan');

const router = Router();

mongoose.connect("mongodb://localhost:27017/proj1db", err => {
    if (err) {
        console.log(err);
    } else {
        console.log('DB connected successfully.');
    }
});

router.use(session({
    secret: '$E(rET|<EY',
    resave: false,
    saveUninitialized: true,
    httpOnly: true,
    store: new MongoStore({
        mongoUrl: 'mongodb://localhost:27017/proj1db',
        collection: 'sessions'
    }),
    cookie: {
        maxAge: 7200000
    },
    user: {
        userid: null
    },
}));

//GET

router.get('/', async (req, res) => {
    if (await req.session.user) {
        res.render('index', { loggedIn: true });
    } else {
        res.render('index', { loggedIn: false });
    }
});

router.get('/h', async (req, res) => {
    try {
        if (await req.session.user) {
            const userid = await req.session.user.userid;
            Team.find({ members: {"$elemMatch": { memberid: userid }}}, (err, team) => {
                if (err) {
                    res.status(500);
                    console.log(err);
                }
                if (team) {
                    res.status(200).render('home', {
                        team: team
                    });
                } else {
                    res.status(200).render('myProfile');
                };
            });
        } else {
            res.status(401).redirect('/login');
        }
    } catch (e) {
        res.status(500).redirect('/login');
        console.log(e);
    };
});

router.get('/myprofile', async (req, res) => {
    try {
        if (await req.session.user) {
            const userid = await req.session.user.userid;
            Team.find({ members: {"$elemMatch": { memberid: userid }} }, (err, team) => {
                if (err) {
                    res.status(500);
                    console.log(err);
                }
                if (team) {
                    res.status(200).render('myProfile', {
                        team: team
                    });
                } else {
                    res.status(200).render('myProfile');
                };
            });
        } else {
            res.status(401).redirect('/login');
        };
    } catch (e) {
        console.log(e);
        res.status(500).redirect('/login');
    }
});

router.get('/t/team', async (req, res) => {
    if (await req.session.user) {
        res.status(200).render('newTeam');
    } else {
        res.status(401).redirect('/login');
    };
});

router.get('/t/teamin', async (req, res) => {
    if (await req.session.user) {
        res.status(200).render('teamin');
    } else {
        res.status(401).redirect('/login');
    };
});

router.get('/t/:teamid', async (req, res) => {
    try {
        const user = req.session.user;
        if (await user) {
            const { teamid } = req.params;
            Team.findOne({ _id: teamid }, (err, team) => {
                if (err) {
                    console.log(err);
                };
                if (team) {
                    const userid = user.userid
                    Team.findOne({ _id: teamid, members: {"$elemMatch": { memberid: userid }}}, (err, team) => {
                        if (err) {
                            console.log(err);
                            res.status(500).json({
                                message: ':('
                            });
                        };
                        if (team) {
                            res.status(200).render('teampage', {
                                page: 'home',
                                team
                            })
                        } else {
                            res.status(404).json({
                                message: 'Access denied'
                            })
                        };
                    });
                } else {
                    res.status(404).redirect('/myprofile');
                };
            });
        } else {
            res.status(401).redirect('/login');
        };
    } catch (e) {
        console.log(e);
    };
});

router.get('/t/:teamid/:menu', async (req, res) => {
    const user = req.session.user;
    if (await user) {
        const { teamid , menu } = req.params;
        try {
            const userid = user.userid
            Team.findOne({ _id: teamid, members: {"$elemMatch": { memberid: userid}}}, (err, team) => {
                if (team) {
                    Planner.find({ belonging: teamid }, (err, planner) => {
                        switch (menu) {
                            case 'planner':
                                res.render('teampage', ({
                                    team,
                                    page: 'planner',
                                    planner,
                                }));
                                break;
                            case 'vote':
                                res.render('teampage', ({

                                }));
                                break;
                            case 'settings':
                                Team.find({ $or: [{ ownerid: userid, managerid: { "$elemMatch" : { memberid: userid } } }] }, (err, planner) => {
                                    let authorized;
                                    if (planner) {
                                        authorized = true;
                                    } else {
                                        authorized = false;
                                    }
                                    res.render('teampage', ({
                                        team,
                                        page: 'settings',
                                        authorized,
                                    }));
                                });
                                break;
                            default:
                                res.redirect(`/t/${teamid}`);
                        }
                    });
                } else {
                    res.status(404).redirect('/myprofile');
                };
            });
        } catch (e) {
            console.log(e);
            res.status(502).json({
                message: ':('
            });
        };
    } else {
        res.status(401).redirect('/login');
    };
});

//팀 권한자 체크 : Team.find({ $or: [{ ownerid: userid, managerid: { "$elemMatch" : { memberid: userid } } }] });

router.get('/p/:plannerid', (req, res) => {
    const { plannerid } = req.params;
    const user = req.session.user;
    try {
        if (user) {
            Planner.findOne({ _id: plannerid }, (err, planner) => {
                if (planner) {
                    const belonging = planner.belonging;
                    const userid = user.userid;
                    Team.findOne({ _id: belonging , members: {"$elemMatch": { memberid: userid }}}, (err, team) => {
                        if (err) {
                            console.log(err);
                        };
                        if (team) {
                            Plan.find({ belonging: plannerid }, (err, plan) => {
                                if (plan) {
                                    res.status(200).render('planner', {
                                        planner,
                                        teamid: team._id,
                                        plan
                                    });
                                } else {
                                    res.redirect('/');
                                }
                            })
                        } else {
                            res.status(401).json({
                                message: 'Non-Authorized'
                            });
                        };
                    });
                } else {
                    res.status(404).redirect('/404');
                };
            });
        } else {
            res.status(401).redirect('/login');
        };
    } catch (e) {
        console.log(e);
    };
});

router.get('/login', (req, res) => {
    res.status(200).render('login');
});

router.get('/register', (req, res) => {
    res.status(200).render('register');
});

router.get('/404', (req, res) => {
    res.status(404).render('404unknown');
});

//POST

router.post('/t/:teamid/planner', (req, res) => {
    const { title, discription, teamid } = req.body;
    const user = req.session.user;
    try {
        if (user) {
            const userid = user.userid;
            if (title == '' || discription == '') {
                res.render('planner');
            } else {
                Planner.create({
                    belonging: teamid,
                    author: userid,
                    title,
                    discription,
                });
                res.status(200).redirect(`/t/${teamid}/planner`);
            };
        } else {
            res.status(401).redirect('/login');
        };
    } catch (e) {
        console.log(e);
    }
});

router.post('/plan', (req, res) => {
    const { important, contents, shortmemo, teamid, plannerid } = req.body;
    const user = req.session.user;
    try {
        if (user) {
            const userid = user.userid;
            if (contents == '') {
                res.render('planner');
            } else {
                Team.findOne({ _id: teamid , members: {"$elemMatch": { memberid: userid }}}, (err, team) => {
                    if (team) {
                        Plan.find({ belonging: plannerid }, (err, plan) => {
                            Plan.create({
                                belonging: plannerid,
                                important,
                                contents,
                                shortmemo,
                            });
                        });
                        res.status(200).redirect(`/p/${plannerid}`);
                    } else {
                        res.status(401).json({
                            message: 'Non-Authorized'
                        });
                    };
                });
            };
        } else {
            res.status(401).redirect('/login');
        };
    } catch (e) {
        console.log(e);
    }
});

router.post('/updown', (req, res) => {
    const { updown, planBelonging, planid } = req.body;
    const user = req.session.user;
    try {
        if (user) {
            res.status(501).json({
                message: '구현 못 했습니다 ㅠ'
            })
            // if (updown == up) {

            // } else {

            // }
        } else {
            res.status(401).redirect('/login');
        }
    } catch (e) {
        console.log(e);
    }
});

router.post('/delplan', (req, res) => {
    const { planid, plannerid } = req.body;
    const user = req.session.user;
    if (user) {
        try {
            Plan.findOneAndDelete({ _id: planid }, (err, plan) => {
                if (err) {
                    console.log(err);
                }
                if (plan) {
                    res.status(200).redirect(`/p/${plannerid}`)
                }
            });
        } catch (e) {
            console.log(e);
        }
    } else {
        res.status(401).redirect('/login');
    }
})

router.post('/team', async (req, res) => {
    const user = req.session.user;
    try {
        if (await user) {
            const { teamname } = await req.body;
            const userid = await user.userid;
            Team.findOne({teamname, owner: userid}, (err, team) => {
                if (err) {
                    console.log(err);
                }
                if (team) {
                    res.status(403).redirect('/myprofile');
                } else {
                    Team.insertMany({
                        teamname: teamname,
                        ownerid: userid,
                        members: [{ memberid: userid, }]
                    });
                    res.status(200).redirect('/myprofile');
                }
            });
        } else {
            res.status(404);
        };
    } catch (e) {
        console.log(e);
    }
});

router.post('/teamin', (req, res) => {
    const { teamid } = req.body;
    const user = req.session.user;
    if (user) {
        const userid = user.userid;
        Team.updateOne({ _id: teamid }, {$addToSet: { members: { memberid: userid } }}, (err, done) => {
            if (err) {
                console.log(err);
            };
            if (done) {
                res.status(404).redirect('/myprofile');
            } else {
                res.status(404).redirect('/t/teamin');
            }
        });
    } else {
        res.status(401).redirect('/login');
    }
});

router.post('/delteam', (req, res) => {
    const { teamid, option } = req.body;
    const user = req.session.user;
    if (user) {
        const userid = user.userid;
        try {//권한이 있는가
            if (option == 'delete') {
                Team.find({ $or: [{ ownerid: userid, managerid: { "$elemMatch" : { memberid: userid } } }] }, (err, team) => {
                    if (err) {
                        console.log(err);
                    };
                    if (team) {//존재하는 팀인가
                        Team.findOneAndDelete({ _id: teamid }, (err, done) => {
                            if (err) {
                                console.log(err);
                            };
                            if (done) {
                                res.status(200).redirect('/h');
                            } else {
                                res.status(404).json({
                                    message: `Team(${teamid}) existence: false`
                                })
                            }
                        })
                    } else {
                        res.status(401).json({
                            message: 'Not Authorized'
                        })
                    }
                });
            } else if (option == 'resign') {

            };
        } catch (e) {
            console.log(e);
        };
    } else {
        res.status(401).redirect('/login');
    };
});

router.post('/register', async (req, res) => {
    const { userid, username, password } = await req.body;
    if (userid == '' || username == '' || password == '') {
        res.status(400).json({
            message: "Invalid data"
        });
    } else {
        User.findOne({ userid }, (err, user) => {
            if (err) {
                console.log(err);
                res.status(500).redirect('/');
            }
            if (user) { //기존의 다른 어떤 계정과 일치할 시 회원가입 거부
                res.status(409).json({
                    message: 'User already Exists'
                });
            } else {
                try {
                    bcrypt.hash(password, 10, (err, hashedPassword) => {
                        if (err) {
                            console.log(err);
                        } else {
                            User.create({
                                userid,
                                username,
                                password: hashedPassword
                            });
                        };
                    });
                    req.session.user = {
                        userid: userid
                    };
                    res.status(200).redirect('/h');
                } catch (e) {
                    console.log(e);
                }
            };
        });
    };
});

router.post('/login', async (req, res) => {
    const { userid, password } = await req.body;
    if (userid == '' || password == '') {
        res.status(400).render('login');
    } else {
        User.findOne({ userid }, (err, user) => {
            if (err) {
                console.log(err);
                res.status(500).redirect('/');
            }
            if (user) {
                bcrypt.compare(password, user.password, (err, result) => {
                    if (result) {
                        req.session.user = {
                            userid: userid
                        }
                        res.status(200).redirect('/h');
                    } else {
                        res.status(404).render('login');
                    };
                });
            } else {
                res.status(404).render('login');
            };
        });
    };
});

router.post('/logout', (req, res) => {
    const session = req.session;
    try {
        if (session.user) {
            session.destroy(err => {
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        message: 'Error : Log out feature'
                    });
                } else {
                    res.status(200).redirect('/');
                };
            });
        } else {
            console.log('Wrong [logout] request from Unauthorized Client');
        }
    } catch (e) {
        console.log(e);
    };
});

router.post('/resign', (req, res) => {
    const session = req.session;
    try {
        if (session.user) {
            const userid = session.user.userid
            req.session.destroy(err => { //로그아웃 기능(중복)
                if (err) {
                    console.log(err);
                    res.status(500).json({
                        message: 'Error : Log out feature'
                    });
                } else {
                    User.findOne({ userid: userid }, async (err, user) => {
                        if (user) {
                            await User.findOneAndDelete({ userid: userid }); //회원탈퇴 기능
                            res.status(200).redirect('/');
                        } else { //로그인은 됐지만 유저 정보가 DB에 없는경우(?)
                            res.status(500).json({
                                message: ':('
                            });
                        };
                    });
                };
            });
        } else {
            console.log('Wrong [logout] request from Unauthorized Client');
        }
    } catch (e) {
        console.log(e);
    };
});


module.exports = router;