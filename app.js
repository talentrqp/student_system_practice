let express = require('express');
let svgCaptcha = require('svg-captcha');
let path = require('path');
var bodyParser = require('body-parser');


//导入自己写好的模块
let mymdl = require(path.join(__dirname,'/tools/myT.js'));
//导入session模块
var session = require('express-session');

const url = 'mongodb://localhost:27017';

const dbName = 'test';

//导入数据库模块
const MongoClient = require('mongodb').MongoClient;

// MongoClient.connect(url, function(err, client) {
//     // assert.equal(null, err);
//     // console.log("Connected successfully to server");

//     const db = client.db(dbName);

//     client.close();
// });



let app = express();

//引入模板
app.engine('art', require('express-art-template'));
//设置模板
app.set('views', '/static/views');
//实现静态资源托管
app.use(express.static("static"));


//引用bodyParser中间件

app.use(bodyParser.urlencoded({
    extended: false
}))

//引用session中间件
app.use(session({
    secret: 'keyboard cat', //这是给session加密
}))
//获取登录数据,通过模板传入到主页去
app.get('/', function (req, res) {
    console.log(req.session.userinfo);
});


//路由一 进入登录页 返回页面给用户
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/views/login.html'));
})

//路由六 直接进入首页
app.get('/index', (req, res) => {
    //判断是否登录

    // console.log('lLLl');
    if (req.session.userinfo) {
        // 获取用户名
        let userName = req.session.userinfo.userName;
        // console.log('欢迎回来');
        // console.log(userName);
        
        console.log(req.session.userinfo);//当前的登陆的username

        // mymdl.mess(res,'欢迎回来','/index');
        // res.redirect(path.join(__dirname,'/static/views/index.html'));
        res.render(path.join(__dirname,'/static/views/index.art'), {
            userName
        });
    } else {
        // console.log("123")
        // res.redirect('/login');
        mymdl.mess(res,'您还没有登录哟','/login');
    }
})

//路由三 登录 逻辑
app.post('/login', (req, res) => {
    //接受数据
    // console.log(req.body);
    let userName = req.body.userName;
    let passWord = req.body.password;
    let code = req.body.code;
    //进行判断
    // console.log(req.session.captcha.toLocaleLowerCase())
    if (code == req.session.captcha.toLocaleLowerCase()) {
        // console.log('success');
        MongoClient.connect(url, function (err, client) {
            // assert.equal(null, err);
            // console.log('success');
            // console.log("Connected successfully to server");
            const db = client.db(dbName);
            const collection = db.collection('student_system');
            //去数据库匹配username;如果没有成功,就跳回登录页;如果成功了;继续去数据库匹配密码是否相同,相同就去主页;否则就打回登录页;
            collection.find({
                name: userName
            }).toArray(function (err, docs) {
                // console.log(err);
                // console.log(docs);
                if (docs.length != 0) {
                    //可以继续判断密码
                    if (docs[0].password == passWord) {
                        // assert.equal(err, null);
                        // assert.equal(3, result.result.n);
                        // assert.equal(3, result.ops.length);
                        // console.log("Inserted 3 documents into the collection");
                        // callback(result);
                        // console.log('登录成功');
                        req.session.userinfo = {userName}//登陆成功后保存个东西
                        // console.log(req.session.userinfo)
                        mymdl.mess(res,'欢迎回来','/index');
                        // res.redirect('/index');

                    } else {
                        //提示用户名有问题
                        // console.log("密码输入有误");
                        // res.redirect('/login');
                        mymdl.mess(res,'密码输入有误','/login');
                    }
                    // console.log(docs)
                }else{
                    // console.log("用户名输入有误");
                    // res.redirect('/login');
                    mymdl.mess(res,'用户名输入有误','/login');
                }
            });
            // Find some documents
            // collection.find({userName}).toArray(function(err, docs) {
            // // assert.equal(err, null);
            // console.log(err);
            // // console.log("Found the following records");
            // // console.log(docs);
            // });

            // client.close();
        });
    } else {
        //跳回登录页
        // res.redirect('/login');
        mymdl.mess(res,'验证码输入错误','/login');
    }
    //跳到首页还是打回登录页

})

//路由二 生成图片的功能,并把这个地址传给图片的src属性
app.get('/login/svgCaptcha', (req, res) => {
    var captcha = svgCaptcha.create();
    // console.log(req);
    // console.log(captcha.text);
    //保存刷新出来的验证码
    req.session.captcha = captcha.text;
    // console.log(captcha.text);
    res.type('svg');
    res.status(200).send(captcha.data);
})

//路由四 点击读取注册页
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/views/register.html'));
})

//路由五 注册页逻辑
//思路:1,点击注册,获取username和password
//2,连接数据库,往数据库添加数据;
//3,然后打回登录页
app.post('/register/deal', (req, res) => {
    // console.log(req.body);
    let userName = req.body.userName;
    let password1 = req.body.password;
    MongoClient.connect(url, function (err, client) {
        // assert.equal(null, err);
        console.log('success');
        // console.log("Connected successfully to server");
        const db = client.db(dbName);
        const collection = db.collection('student_system');
        // Find some documents
        //往数据库添加数据;(先查询,看用户名是否存在)
        collection.find({
            name: userName
        }).toArray(function (err, docs) {
            // console.log(err);
            if (docs.length == 0) {
                //可以注册
                collection.insertOne({
                    name: userName,
                    password: password1
                }, function (err, result) {
                    // assert.equal(err, null);
                    // assert.equal(3, result.result.n);
                    // assert.equal(3, result.ops.length);
                    // console.log("Inserted 3 documents into the collection");
                    // callback(result);
                    // console.log('注册成功');
                    res.redirect('/login');
                    mymdl.mess(res,'注册成功','/login');
                });
            } else {
                //不能注册,打回注册页
                // res.redirect('/register');
                mymdl.mess(res,'该用户名已注册','/register');
            }
            // console.log(docs)
        });


        // client.close();
    });
})

//路由七 删除逻辑
app.get('/delete',(req,res)=>{
    delete req.session.userinfo;
    // res.redirect('/login');
    mymdl.mess(res,'确定登出吗','/login');
})

app.listen(2888, () => {
    console.log('监听成功');
})

