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
"[project]/lib/services/analytics-service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateMTTR",
    ()=>calculateMTTR,
    "exportAnalyticsToCSV",
    ()=>exportAnalyticsToCSV,
    "getAgentPerformance",
    ()=>getAgentPerformance,
    "getDashboardMetrics",
    ()=>getDashboardMetrics,
    "getTicketVolumeByDay",
    ()=>getTicketVolumeByDay
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs)");
;
;
async function getDashboardMetrics(filters) {
    const where = {};
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.priority) {
        where.priority = filters.priority;
    }
    if (filters?.status) {
        where.status = filters.status;
    }
    const [totalTickets, openTickets, resolvedTickets, closedTickets, ticketsByPriority, ticketsByStatus, resolvedTicketsWithTime, slaTracking] = await Promise.all([
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.count({
            where
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.count({
            where: {
                ...where,
                status: {
                    in: [
                        __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].NEW,
                        __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].IN_PROGRESS
                    ]
                }
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.count({
            where: {
                ...where,
                status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].RESOLVED
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.count({
            where: {
                ...where,
                status: __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].CLOSED
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.groupBy({
            by: [
                'priority'
            ],
            where,
            _count: true
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.groupBy({
            by: [
                'status'
            ],
            where,
            _count: true
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.findMany({
            where: {
                ...where,
                status: {
                    in: [
                        __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].RESOLVED,
                        __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].CLOSED
                    ]
                },
                closedAt: {
                    not: null
                },
                createdAt: {
                    not: null
                }
            },
            select: {
                createdAt: true,
                closedAt: true
            }
        }),
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sLATracking.findMany({
            where: filters?.startDate || filters?.endDate ? {
                createdAt: {
                    ...filters.startDate && {
                        gte: filters.startDate
                    },
                    ...filters.endDate && {
                        lte: filters.endDate
                    }
                }
            } : {},
            select: {
                firstResponseBreached: true,
                resolutionBreached: true
            }
        })
    ]);
    // Calculate average resolution time
    let averageResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
        const totalMinutes = resolvedTicketsWithTime.reduce((sum, ticket)=>{
            if (ticket.closedAt && ticket.createdAt) {
                const diff = ticket.closedAt.getTime() - ticket.createdAt.getTime();
                return sum + diff / (1000 * 60) // Convert to minutes
                ;
            }
            return sum;
        }, 0);
        averageResolutionTime = totalMinutes / resolvedTicketsWithTime.length;
    }
    // Calculate SLA compliance
    let slaCompliance = 100;
    if (slaTracking.length > 0) {
        const totalBreaches = slaTracking.filter((t)=>t.firstResponseBreached || t.resolutionBreached).length;
        slaCompliance = (slaTracking.length - totalBreaches) / slaTracking.length * 100;
    }
    // Build tickets by priority
    const priorityCounts = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
    };
    ticketsByPriority.forEach((item)=>{
        priorityCounts[item.priority] = item._count;
    });
    // Build tickets by status
    const statusCounts = {
        NEW: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0
    };
    ticketsByStatus.forEach((item)=>{
        statusCounts[item.status] = item._count;
    });
    return {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        averageResolutionTime: Math.round(averageResolutionTime),
        slaCompliance: Math.round(slaCompliance * 100) / 100,
        ticketsByPriority: priorityCounts,
        ticketsByStatus: statusCounts
    };
}
async function getAgentPerformance(filters) {
    const where = {
        assigneeId: {
            not: null
        }
    };
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.agentId) {
        where.assigneeId = filters.agentId;
    }
    const tickets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.findMany({
        where,
        include: {
            assignee: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                }
            },
            slaTracking: {
                select: {
                    firstResponseActual: true,
                    firstResponseTarget: true,
                    resolutionActual: true,
                    resolutionTarget: true,
                    firstResponseBreached: true,
                    resolutionBreached: true
                }
            }
        }
    });
    // Group by agent
    const agentMap = new Map();
    tickets.forEach((ticket)=>{
        if (!ticket.assignee) return;
        const agentId = ticket.assignee.id;
        if (!agentMap.has(agentId)) {
            agentMap.set(agentId, {
                id: agentId,
                name: `${ticket.assignee.firstName || ''} ${ticket.assignee.lastName || ''}`.trim() || ticket.assignee.email,
                email: ticket.assignee.email,
                ticketsResolved: 0,
                ticketsAssigned: 0,
                averageResolutionTime: 0,
                slaCompliance: 100,
                firstResponseTime: 0
            });
        }
        const agent = agentMap.get(agentId);
        agent.ticketsAssigned++;
        if (ticket.status === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].RESOLVED || ticket.status === __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].CLOSED) {
            agent.ticketsResolved++;
            if (ticket.closedAt && ticket.createdAt) {
                const resolutionTime = (ticket.closedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60);
                agent.averageResolutionTime = (agent.averageResolutionTime * (agent.ticketsResolved - 1) + resolutionTime) / agent.ticketsResolved;
            }
        }
        // Calculate first response time from SLA tracking
        if (ticket.slaTracking?.firstResponseActual && ticket.slaTracking?.firstResponseTarget) {
            const firstResponseTime = (ticket.slaTracking.firstResponseActual.getTime() - ticket.createdAt.getTime()) / (1000 * 60);
            agent.firstResponseTime = (agent.firstResponseTime * (agent.ticketsAssigned - 1) + firstResponseTime) / agent.ticketsAssigned;
        }
        // Calculate SLA compliance
        if (ticket.slaTracking) {
            const totalTickets = agent.ticketsAssigned;
            const breaches = agent.ticketsResolved - agent.ticketsResolved + // Previous breaches
            (ticket.slaTracking.firstResponseBreached || ticket.slaTracking.resolutionBreached ? 1 : 0);
            agent.slaCompliance = totalTickets > 0 ? (totalTickets - breaches) / totalTickets * 100 : 100;
        }
    });
    // Calculate final SLA compliance for each agent
    const agents = Array.from(agentMap.values());
    for (const agent of agents){
        const agentTickets = tickets.filter((t)=>t.assigneeId === agent.id);
        const slaTrackings = agentTickets.map((t)=>t.slaTracking).filter((t)=>t !== null);
        if (slaTrackings.length > 0) {
            const breaches = slaTrackings.filter((t)=>t.firstResponseBreached || t.resolutionBreached).length;
            agent.slaCompliance = (slaTrackings.length - breaches) / slaTrackings.length * 100;
        }
        agent.averageResolutionTime = Math.round(agent.averageResolutionTime);
        agent.firstResponseTime = Math.round(agent.firstResponseTime);
        agent.slaCompliance = Math.round(agent.slaCompliance * 100) / 100;
    }
    return agents.sort((a, b)=>b.ticketsResolved - a.ticketsResolved);
}
async function calculateMTTR(filters) {
    const where = {
        status: {
            in: [
                __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].RESOLVED,
                __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$29$__["TicketStatus"].CLOSED
            ]
        },
        closedAt: {
            not: null
        }
    };
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    if (filters?.agentId) {
        where.assigneeId = filters.agentId;
    }
    const tickets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.findMany({
        where,
        select: {
            createdAt: true,
            closedAt: true
        }
    });
    const ticketsWithTime = tickets.filter((t)=>t.closedAt && t.createdAt);
    if (ticketsWithTime.length === 0) {
        return 0;
    }
    const totalMinutes = ticketsWithTime.reduce((sum, ticket)=>{
        const diff = ticket.closedAt.getTime() - ticket.createdAt.getTime();
        return sum + diff / (1000 * 60) // Convert to minutes
        ;
    }, 0);
    return Math.round(totalMinutes / ticketsWithTime.length);
}
async function getTicketVolumeByDay(filters) {
    const where = {};
    if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    const tickets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.findMany({
        where,
        select: {
            createdAt: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });
    // Group by day
    const dayMap = new Map();
    tickets.forEach((ticket)=>{
        const date = ticket.createdAt.toISOString().split('T')[0];
        dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });
    return Array.from(dayMap.entries()).map(([date, count])=>({
            date,
            count
        })).sort((a, b)=>a.date.localeCompare(b.date));
}
async function exportAnalyticsToCSV(type, filters) {
    let csvData = '';
    if (type === 'tickets') {
        const where = {};
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        const tickets = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].ticket.findMany({
            where,
            include: {
                requester: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                assignee: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        csvData = [
            'Ticket Number,Subject,Status,Priority,Requester,Assignee,Created At,Closed At',
            ...tickets.map((t)=>[
                    t.ticketNumber,
                    `"${t.subject.replace(/"/g, '""')}"`,
                    t.status,
                    t.priority,
                    t.requester.email,
                    t.assignee?.email || 'Unassigned',
                    t.createdAt.toISOString(),
                    t.closedAt?.toISOString() || ''
                ].join(','))
        ].join('\n');
    } else if (type === 'agents') {
        const agents = await getAgentPerformance(filters);
        csvData = [
            'Agent Name,Email,Tickets Resolved,Tickets Assigned,Average Resolution Time (min),SLA Compliance (%)',
            ...agents.map((a)=>[
                    `"${a.name.replace(/"/g, '""')}"`,
                    a.email,
                    a.ticketsResolved,
                    a.ticketsAssigned,
                    a.averageResolutionTime,
                    a.slaCompliance
                ].join(','))
        ].join('\n');
    } else if (type === 'sla') {
        const where = {};
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }
        const tracking = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sLATracking.findMany({
            where,
            include: {
                ticket: {
                    select: {
                        ticketNumber: true,
                        subject: true
                    }
                },
                slaPolicy: {
                    select: {
                        name: true,
                        priority: true
                    }
                }
            }
        });
        csvData = [
            'Ticket Number,Subject,SLA Policy,First Response Target,First Response Actual,First Response Breached,Resolution Target,Resolution Actual,Resolution Breached',
            ...tracking.map((t)=>[
                    t.ticket.ticketNumber,
                    `"${t.ticket.subject.replace(/"/g, '""')}"`,
                    t.slaPolicy.name,
                    t.firstResponseTarget?.toISOString() || '',
                    t.firstResponseActual?.toISOString() || '',
                    t.firstResponseBreached ? 'Yes' : 'No',
                    t.resolutionTarget?.toISOString() || '',
                    t.resolutionActual?.toISOString() || '',
                    t.resolutionBreached ? 'Yes' : 'No'
                ].join(','))
        ].join('\n');
    }
    return csvData;
}
}),
"[project]/app/api/v1/analytics/mttr/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/middleware/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$analytics$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/services/analytics-service.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const authContext = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getAuthContext"])(request);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$middleware$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAuth"])(authContext);
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')) : undefined;
        const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')) : undefined;
        const agentId = searchParams.get('agentId') || undefined;
        const mttr = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$services$2f$analytics$2d$service$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["calculateMTTR"])({
            startDate,
            endDate,
            agentId
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: {
                mttr
            }
        }, {
            status: 200
        });
    } catch (error) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error instanceof Error ? error.message : 'An unexpected error occurred'
            }
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__98a3c8a2._.js.map