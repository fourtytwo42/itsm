module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/jwt.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signRefreshToken",
    ()=>signRefreshToken,
    "signToken",
    ()=>signToken,
    "verifyRefreshToken",
    ()=>verifyRefreshToken,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '3d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
function signToken(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
    });
}
function verifyToken(token) {
    try {
        const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET, {
            algorithms: [
                'HS256'
            ]
        });
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}
function signRefreshToken(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
        algorithm: 'HS256'
    });
}
function verifyRefreshToken(token) {
    try {
        const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_REFRESH_SECRET, {
            algorithms: [
                'HS256'
            ]
        });
        return decoded;
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
}
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client", () => require("@prisma/client"));

module.exports = mod;
}),
"[project]/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        'query',
        'error',
        'warn'
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) {
    globalForPrisma.prisma = prisma;
}
const __TURBOPACK__default__export__ = prisma;
}),
"[project]/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "authenticateUser",
    ()=>authenticateUser,
    "getUserById",
    ()=>getUserById,
    "hashPassword",
    ()=>hashPassword,
    "registerUser",
    ()=>registerUser,
    "verifyPassword",
    ()=>verifyPassword
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/bcryptjs/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jwt.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
;
;
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$bcryptjs$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].compare(password, hash);
}
async function authenticateUser(credentials) {
    const { email, password } = credentials;
    // Find user with roles
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique({
        where: {
            email
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
    if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
    }
    if (!user.isActive) {
        throw new Error('Account is inactive');
    }
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
        throw new Error('Invalid email or password');
    }
    // Update last login
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.update({
        where: {
            id: user.id
        },
        data: {
            updatedAt: new Date()
        }
    });
    // Get user roles
    const roles = user.roles.map((ur)=>ur.role.name);
    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        roles
    };
    const accessToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signToken"])(tokenPayload);
    const refreshToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signRefreshToken"])({
        userId: user.id,
        email: user.email
    });
    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles
        },
        accessToken,
        refreshToken
    };
}
async function registerUser(data) {
    const { email, password, firstName, lastName } = data;
    // Check if user already exists
    const existingUser = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique({
        where: {
            email
        }
    });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }
    // Hash password
    const passwordHash = await hashPassword(password);
    // Create user with END_USER role by default
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.create({
        data: {
            email,
            passwordHash,
            firstName,
            lastName,
            roles: {
                create: {
                    role: {
                        connect: {
                            name: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["RoleName"].END_USER
                        }
                    }
                }
            }
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
    // Get user roles
    const roles = user.roles.map((ur)=>ur.role.name);
    // Generate tokens
    const tokenPayload = {
        userId: user.id,
        email: user.email,
        roles
    };
    const accessToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signToken"])(tokenPayload);
    const refreshToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signRefreshToken"])({
        userId: user.id,
        email: user.email
    });
    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles
        },
        accessToken,
        refreshToken
    };
}
async function getUserById(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].user.findUnique({
        where: {
            id: userId
        },
        include: {
            roles: {
                include: {
                    role: true
                }
            }
        }
    });
}
}),
"[project]/lib/middleware/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAuthContext",
    ()=>getAuthContext,
    "requireAnyRole",
    ()=>requireAnyRole,
    "requireAuth",
    ()=>requireAuth,
    "requireRole",
    ()=>requireRole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jwt.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
;
;
async function getAuthContext(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyToken"])(token);
        const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserById"])(payload.userId);
        if (!user || !user.isActive) {
            return null;
        }
        const roles = user.roles.map((ur)=>ur.role.name);
        return {
            user: {
                id: user.id,
                email: user.email,
                roles
            }
        };
    } catch (error) {
        return null;
    }
}
function requireAuth(authContext) {
    if (!authContext) {
        throw new Error('Unauthorized');
    }
}
function requireRole(authContext, role) {
    requireAuth(authContext);
    if (!authContext.user.roles.includes(role)) {
        throw new Error('Forbidden: Insufficient permissions');
    }
}
function requireAnyRole(authContext, roles) {
    requireAuth(authContext);
    const hasRole = roles.some((role)=>authContext.user.roles.includes(role));
    if (!hasRole) {
        throw new Error('Forbidden: Insufficient permissions');
    }
}
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/events [external] (events, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("events", () => require("events"));

module.exports = mod;
}),
"[externals]/https [external] (https, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("https", () => require("https"));

module.exports = mod;
}),
"[externals]/http [external] (http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("http", () => require("http"));

module.exports = mod;
}),
"[externals]/net [external] (net, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("net", () => require("net"));

module.exports = mod;
}),
"[externals]/tls [external] (tls, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("tls", () => require("tls"));

module.exports = mod;
}),
"[externals]/url [external] (url, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("url", () => require("url"));

module.exports = mod;
}),
"[project]/lib/websocket/server.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "wsServer",
    ()=>wsServer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$wrapper$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/ws/wrapper.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$lib$2f$websocket$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__WebSocketServer$3e$__ = __turbopack_context__.i("[project]/node_modules/ws/lib/websocket-server.js [app-route] (ecmascript) <export default as WebSocketServer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$lib$2f$websocket$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__WebSocket$3e$__ = __turbopack_context__.i("[project]/node_modules/ws/lib/websocket.js [app-route] (ecmascript) <export default as WebSocket>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/jwt.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/auth.ts [app-route] (ecmascript)");
;
;
;
class WSServer {
    wss = null;
    clients = new Map() // userId -> client
    ;
    ticketSubscriptions = new Map() // ticketId -> Set of userIds
    ;
    initialize(server) {
        this.wss = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$lib$2f$websocket$2d$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__WebSocketServer$3e$__["WebSocketServer"]({
            server,
            path: '/ws'
        });
        this.wss.on('connection', async (ws, req)=>{
            try {
                // Extract token from query string or Authorization header
                const url = new URL(req.url || '', `http://${req.headers.host}`);
                const token = url.searchParams.get('token') || this.extractTokenFromHeaders(req.headers);
                if (!token) {
                    ws.close(1008, 'Authentication required');
                    return;
                }
                // Verify JWT token
                const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$jwt$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyToken"])(token);
                const user = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUserById"])(payload.userId);
                if (!user || !user.isActive) {
                    ws.close(1008, 'Invalid or inactive user');
                    return;
                }
                const roles = user.roles.map((ur)=>ur.role.name);
                const client = {
                    ws,
                    userId: user.id,
                    email: user.email,
                    roles,
                    subscriptions: new Set()
                };
                // Store client
                this.clients.set(user.id, client);
                // Send connection confirmation
                this.sendToClient(client, {
                    event: 'connected',
                    data: {
                        userId: user.id,
                        email: user.email
                    }
                });
                // Handle messages
                ws.on('message', (data)=>{
                    try {
                        const message = JSON.parse(data.toString());
                        this.handleMessage(client, message);
                    } catch (error) {
                        this.sendToClient(client, {
                            event: 'error',
                            error: 'Invalid message format'
                        });
                    }
                });
                // Handle disconnect
                ws.on('close', ()=>{
                    this.handleDisconnect(client);
                });
                // Handle errors
                ws.on('error', (error)=>{
                    console.error('WebSocket error:', error);
                    this.handleDisconnect(client);
                });
            } catch (error) {
                console.error('WebSocket connection error:', error);
                ws.close(1008, error.message || 'Connection failed');
            }
        });
        console.log('WebSocket server initialized on /ws');
    }
    extractTokenFromHeaders(headers) {
        const authHeader = headers.authorization || headers.Authorization;
        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    handleMessage(client, message) {
        switch(message.event){
            case 'subscribe:ticket':
                if (message.data?.ticketId) {
                    client.subscriptions.add(`ticket:${message.data.ticketId}`);
                    this.subscribeToTicket(message.data.ticketId, client.userId);
                    this.sendToClient(client, {
                        event: 'subscribed',
                        data: {
                            resource: `ticket:${message.data.ticketId}`
                        }
                    });
                }
                break;
            case 'unsubscribe:ticket':
                if (message.data?.ticketId) {
                    client.subscriptions.delete(`ticket:${message.data.ticketId}`);
                    this.unsubscribeFromTicket(message.data.ticketId, client.userId);
                    this.sendToClient(client, {
                        event: 'unsubscribed',
                        data: {
                            resource: `ticket:${message.data.ticketId}`
                        }
                    });
                }
                break;
            case 'ping':
                this.sendToClient(client, {
                    event: 'pong'
                });
                break;
            default:
                this.sendToClient(client, {
                    event: 'error',
                    error: `Unknown event: ${message.event}`
                });
        }
    }
    subscribeToTicket(ticketId, userId) {
        if (!this.ticketSubscriptions.has(ticketId)) {
            this.ticketSubscriptions.set(ticketId, new Set());
        }
        this.ticketSubscriptions.get(ticketId).add(userId);
    }
    unsubscribeFromTicket(ticketId, userId) {
        const subscribers = this.ticketSubscriptions.get(ticketId);
        if (subscribers) {
            subscribers.delete(userId);
            if (subscribers.size === 0) {
                this.ticketSubscriptions.delete(ticketId);
            }
        }
    }
    handleDisconnect(client) {
        // Remove all ticket subscriptions
        for (const sub of client.subscriptions){
            if (sub.startsWith('ticket:')) {
                const ticketId = sub.replace('ticket:', '');
                this.unsubscribeFromTicket(ticketId, client.userId);
            }
        }
        this.clients.delete(client.userId);
    }
    sendToClient(client, message) {
        if (client.ws.readyState === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$ws$2f$lib$2f$websocket$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__WebSocket$3e$__["WebSocket"].OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    }
    // Public methods for broadcasting events
    broadcastToUser(userId, event, data) {
        const client = this.clients.get(userId);
        if (client) {
            this.sendToClient(client, {
                event,
                data
            });
        }
    }
    broadcastToTicketSubscribers(ticketId, event, data) {
        const subscribers = this.ticketSubscriptions.get(ticketId);
        if (subscribers) {
            subscribers.forEach((userId)=>{
                this.broadcastToUser(userId, event, data);
            });
        }
    }
    broadcastToAll(event, data) {
        this.clients.forEach((client)=>{
            this.sendToClient(client, {
                event,
                data
            });
        });
    }
    broadcastToRoles(roles, event, data) {
        this.clients.forEach((client)=>{
            if (roles.some((role)=>client.roles.includes(role))) {
                this.sendToClient(client, {
                    event,
                    data
                });
            }
        });
    }
    getClientCount() {
        return this.clients.size;
    }
    getTicketSubscriberCount(ticketId) {
        return this.ticketSubscriptions.get(ticketId)?.size || 0;
    }
}
const wsServer = new WSServer();
}),
"[project]/lib/services/notification-service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createNotification",
    ()=>createNotification,
    "deleteNotification",
    ()=>deleteNotification,
    "getNotificationPreferences",
    ()=>getNotificationPreferences,
    "getNotifications",
    ()=>getNotifications,
    "getUnreadCount",
    ()=>getUnreadCount,
    "markAllAsRead",
    ()=>markAllAsRead,
    "markAsRead",
    ()=>markAsRead,
    "notifyTicketAssigned",
    ()=>notifyTicketAssigned,
    "notifyTicketComment",
    ()=>notifyTicketComment,
    "notifyTicketCreated",
    ()=>notifyTicketCreated,
    "notifyTicketUpdated",
    ()=>notifyTicketUpdated,
    "updateNotificationPreferences",
    ()=>updateNotificationPreferences
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$websocket$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/websocket/server.ts [app-route] (ecmascript)");
;
;
;
async function createNotification(params) {
    const notification = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.create({
        data: {
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            metadata: params.metadata || {}
        }
    });
    // Check user's notification preferences
    const preferences = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notificationPreference.findUnique({
        where: {
            userId: params.userId
        }
    });
    // Only send real-time notification if enabled
    const shouldNotify = preferences ? getPreferenceForType(preferences, params.type) : true // Default to true if no preferences set
    ;
    if (shouldNotify) {
        // Send via WebSocket
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$websocket$2f$server$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["wsServer"].broadcastToUser(params.userId, 'notification:new', {
            notification: {
                id: notification.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                link: notification.link,
                createdAt: notification.createdAt
            }
        });
    }
    return notification;
}
function getPreferenceForType(preferences, type) {
    switch(type){
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_CREATED:
            return preferences.ticketCreated;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_UPDATED:
            return preferences.ticketUpdated;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_ASSIGNED:
            return preferences.ticketAssigned;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_COMMENT:
            return preferences.ticketComment;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].CHANGE_REQUEST_CREATED:
            return preferences.changeRequestCreated;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].CHANGE_REQUEST_APPROVED:
            return preferences.changeRequestApproved;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].CHANGE_REQUEST_REJECTED:
            return preferences.changeRequestRejected;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].SLA_BREACHED:
            return preferences.slaBreached;
        case __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].ESCALATION:
            return preferences.escalation;
        default:
            return true;
    }
}
async function getNotifications(userId, options) {
    const where = {
        userId
    };
    if (options?.unreadOnly) {
        where.status = __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationStatus"].UNREAD;
    }
    const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.findMany({
        where,
        orderBy: {
            createdAt: 'desc'
        },
        take: options?.limit || 50
    });
    return notifications;
}
async function markAsRead(notificationId, userId) {
    const notification = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.updateMany({
        where: {
            id: notificationId,
            userId
        },
        data: {
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationStatus"].READ,
            readAt: new Date()
        }
    });
    return notification.count > 0;
}
async function markAllAsRead(userId) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.updateMany({
        where: {
            userId,
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationStatus"].UNREAD
        },
        data: {
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationStatus"].READ,
            readAt: new Date()
        }
    });
}
async function deleteNotification(notificationId, userId) {
    const notification = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.deleteMany({
        where: {
            id: notificationId,
            userId
        }
    });
    return notification.count > 0;
}
async function getUnreadCount(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notification.count({
        where: {
            userId,
            status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationStatus"].UNREAD
        }
    });
}
async function getNotificationPreferences(userId) {
    let preferences = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notificationPreference.findUnique({
        where: {
            userId
        }
    });
    // Create default preferences if they don't exist
    if (!preferences) {
        preferences = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notificationPreference.create({
            data: {
                userId,
                emailEnabled: true,
                pushEnabled: true,
                ticketCreated: true,
                ticketUpdated: true,
                ticketAssigned: true,
                ticketComment: true,
                changeRequestCreated: true,
                changeRequestApproved: true,
                changeRequestRejected: true,
                slaBreached: true,
                escalation: true
            }
        });
    }
    return preferences;
}
async function updateNotificationPreferences(userId, updates) {
    const preferences = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].notificationPreference.upsert({
        where: {
            userId
        },
        update: updates,
        create: {
            userId,
            emailEnabled: true,
            pushEnabled: true,
            ticketCreated: true,
            ticketUpdated: true,
            ticketAssigned: true,
            ticketComment: true,
            changeRequestCreated: true,
            changeRequestApproved: true,
            changeRequestRejected: true,
            slaBreached: true,
            escalation: true,
            ...updates
        }
    });
    return preferences;
}
async function notifyTicketCreated(ticketId, ticketNumber, assigneeId) {
    if (assigneeId) {
        await createNotification({
            userId: assigneeId,
            type: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_ASSIGNED,
            title: 'New Ticket Assigned',
            message: `Ticket ${ticketNumber} has been assigned to you.`,
            link: `/tickets/${ticketId}`,
            metadata: {
                ticketId,
                ticketNumber
            }
        });
    }
}
async function notifyTicketUpdated(ticketId, ticketNumber, changes, userIds) {
    for (const userId of userIds){
        await createNotification({
            userId,
            type: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_UPDATED,
            title: 'Ticket Updated',
            message: `Ticket ${ticketNumber} has been updated.`,
            link: `/tickets/${ticketId}`,
            metadata: {
                ticketId,
                ticketNumber,
                changes
            }
        });
    }
}
async function notifyTicketAssigned(ticketId, ticketNumber, assigneeId) {
    await createNotification({
        userId: assigneeId,
        type: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_ASSIGNED,
        title: 'Ticket Assigned',
        message: `Ticket ${ticketNumber} has been assigned to you.`,
        link: `/tickets/${ticketId}`,
        metadata: {
            ticketId,
            ticketNumber
        }
    });
}
async function notifyTicketComment(ticketId, ticketNumber, commentAuthorId, userIds) {
    // Don't notify the comment author
    const recipients = userIds.filter((id)=>id !== commentAuthorId);
    for (const userId of recipients){
        await createNotification({
            userId,
            type: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["NotificationType"].TICKET_COMMENT,
            title: 'New Comment',
            message: `A new comment was added to ticket ${ticketNumber}.`,
            link: `/tickets/${ticketId}`,
            metadata: {
                ticketId,
                ticketNumber,
                commentAuthorId
            }
        });
    }
}
}),
"[project]/app/api/v1/notifications/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/middleware/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/notification-service.ts [app-route] (ecmascript)");
;
;
;
async function GET(req) {
    try {
        const authContext = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthContext"])(req);
        if (!authContext) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { user } = authContext;
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const unreadOnly = searchParams.get('unreadOnly') === 'true';
        const notifications = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getNotifications"])(user.id, {
            limit,
            unreadOnly
        });
        const unreadCount = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getUnreadCount"])(user.id);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: {
                code: 'NOTIFICATIONS_ERROR',
                message: error.message
            }
        }, {
            status: 500
        });
    }
}
async function PUT(req) {
    try {
        const authContext = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthContext"])(req);
        if (!authContext) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const { user } = authContext;
        const body = await req.json();
        if (body.action === 'markAllAsRead') {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$notification$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["markAllAsRead"])(user.id);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: {
                    message: 'All notifications marked as read'
                }
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: 'Invalid action'
        }, {
            status: 400
        });
    } catch (error) {
        console.error('Update notifications error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: {
                code: 'NOTIFICATIONS_ERROR',
                message: error.message
            }
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__ea568406._.js.map