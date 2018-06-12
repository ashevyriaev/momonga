/**
 * @swagger
 * securityDefinitions:
 *   APIKeyQueryParam:
 *     type: apiKey
 *     in: query
 *     name: token
 *   cookieAuth:
 *     type: apiKey
 *     in: cookie
 *     name: koa.sid
 * /verify-auth:
 *   get:
 *     tags:
 *       - Auth - работа с авторизацией и регистрацией
 *     description: Проверяет авторизирован ли пользователь. В дальнейшем будет удален! Используйте -> /auth-user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "ok"
 * /is-login-taken:
 *   get:
 *     tags:
 *       - Auth - работа с авторизацией и регистрацией
 *     description: Проверяет занят ли логин
 *     produces:
 *       - application/json
 *     parameters:
 *      - name: login
 *        description: логин
 *        in: query
 *        type: string
 *        required: true
 *        example: 'test'
 *     responses:
 *       200:
 *         description: '{taken: false} or {taken: true}'
 * /logout:
 *   get:
 *     tags:
 *       - Auth - работа с авторизацией и регистрацией
 *     description: Выйти из учетной записи
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: "ok"
 * /login:
 *   post:
 *     tags:
 *       - Auth - работа с авторизацией и регистрацией
 *     description: Вход в учетную запись
 *     produces:
 *       - application/json
 *     parameters:
 *      - name: body
 *        description: Почта
 *        in: body
 *        required: true
 *        example: {email: 'momo@momonga.ru', password: '123456'}
 *     responses:
 *       200:
 *         description: объект с именем и почтой
 * /regist:
 *   post:
 *     tags:
 *       - Auth - работа с авторизацией и регистрацией
 *     description: Регистрация новой учетной записи
 *     produces:
 *       - application/json
 *     parameters:
 *      - name: user
 *        description: Новый объект данных user
 *        in: body
 *        required: true
 *        example:
 *        schema:
 *          $ref: '#/definitions/User'
 *     responses:
 *       200:
 *         description: "ok"
 */
const Router = require("koa-router");
const auth = new Router();
const passport = require('koa-passport');
const User = require('../models/user');
const isAuthenticated = require('../libs/isAuthenticated');

auth
    .get('is-login-taken', '/is-login-taken', async (ctx, next) => {
        try {
            const login = ctx.request.query.login;
            const user = await User.findOne({where: {login}});

            if (user) {
                ctx.body = {taken: true};

                return;
            }

            ctx.body = {taken: false};
        } catch(err) {
            ctx.throw(422, err, {cause: {...err}});
        }
    })
    .get('logout', '/logout', (ctx, next) => {
        try {
            ctx.logout();
            ctx.body = {res: 'ok'};
        } catch(e) {
            ctx.throw(422, err, {cause: {...err}});
        }
    })
    .post('login', '/login', function (ctx, next) {
        return passport.authenticate('local', async function(err, user, info) {
            if (err) throw err;

            ctx.assert(user, 401, info.message);
            ctx.login(user);
            ctx.body = user;
        })(ctx, next);
    })
    .post('register', '/register', async (ctx, next) => {
        try {
            let user = ctx.request.body;
            let [userDuplicateEmail, userWithDuplicateLogin] = await Promise.all([
                User.findOne({where: { email: user.email }}),
                User.findOne({where: { login: user.login }})
            ]);
            ctx.assert(
                !userDuplicateEmail,
                422,
                userDuplicateEmail ? `E-mail: ${userDuplicateEmail.email} уже зарегистрирован!` : ``
            );
            ctx.assert(
                !userWithDuplicateLogin,
                422,
                userWithDuplicateLogin ? `Login: ${userWithDuplicateLogin.login} уже зарегистрирован!` : ``
            );

            user = await User.create(ctx.request.body);

            ctx.login(user);
            ctx.body = user.toJson();
        } catch(err) {
            ctx.throw(422, err, {cause: {...err}});
        }
    });

module.exports = auth;
