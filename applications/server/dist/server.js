"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@trpc/server/adapters/standalone");
const router_1 = require("./router");
const server = (0, standalone_1.createHTTPServer)({
    router: router_1.appRouter,
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
server.listen(port);
console.log(`🚀 tRPC server running on port ${port}`);
