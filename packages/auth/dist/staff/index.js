"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOnly = exports.StaffOnly = exports.AuthGuard = exports.useStaffAuth = void 0;
var useStaffAuth_1 = require("./useStaffAuth");
Object.defineProperty(exports, "useStaffAuth", { enumerable: true, get: function () { return useStaffAuth_1.useStaffAuth; } });
var guards_1 = require("../guards");
Object.defineProperty(exports, "AuthGuard", { enumerable: true, get: function () { return guards_1.AuthGuard; } });
Object.defineProperty(exports, "StaffOnly", { enumerable: true, get: function () { return guards_1.StaffOnly; } });
Object.defineProperty(exports, "AdminOnly", { enumerable: true, get: function () { return guards_1.AdminOnly; } });
