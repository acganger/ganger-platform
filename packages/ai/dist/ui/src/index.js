"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.colorUtils = exports.tailwindColors = exports.cssVariables = exports.colors = exports.cn = exports.GangerLogoCompact = exports.GangerHeader = exports.GangerLogo = exports.useTheme = exports.ThemeProvider = exports.StatCard = exports.PageHeader = exports.AppLayout = exports.FormField = exports.useToast = exports.ToastContainer = exports.ToastProvider = exports.Toast = exports.ModalFooter = exports.ModalContent = exports.ModalHeader = exports.Modal = exports.DataTable = exports.CardDescription = exports.CardTitle = exports.CardFooter = exports.CardContent = exports.CardHeader = exports.Card = exports.Switch = exports.Avatar = exports.Badge = exports.Checkbox = exports.Select = exports.Input = exports.LoadingSpinner = exports.Button = void 0;
// Core UI Components
var Button_1 = require("./components/Button");
Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return Button_1.Button; } });
var LoadingSpinner_1 = require("./components/LoadingSpinner");
Object.defineProperty(exports, "LoadingSpinner", { enumerable: true, get: function () { return LoadingSpinner_1.LoadingSpinner; } });
var Input_1 = require("./components/Input");
Object.defineProperty(exports, "Input", { enumerable: true, get: function () { return Input_1.Input; } });
var Select_1 = require("./components/Select");
Object.defineProperty(exports, "Select", { enumerable: true, get: function () { return Select_1.Select; } });
var Checkbox_1 = require("./components/Checkbox");
Object.defineProperty(exports, "Checkbox", { enumerable: true, get: function () { return Checkbox_1.Checkbox; } });
var Badge_1 = require("./components/Badge");
Object.defineProperty(exports, "Badge", { enumerable: true, get: function () { return Badge_1.Badge; } });
var Avatar_1 = require("./components/Avatar");
Object.defineProperty(exports, "Avatar", { enumerable: true, get: function () { return Avatar_1.Avatar; } });
var Switch_1 = require("./components/Switch");
Object.defineProperty(exports, "Switch", { enumerable: true, get: function () { return Switch_1.Switch; } });
// Data Display Components
var Card_1 = require("./components/Card");
Object.defineProperty(exports, "Card", { enumerable: true, get: function () { return Card_1.Card; } });
Object.defineProperty(exports, "CardHeader", { enumerable: true, get: function () { return Card_1.CardHeader; } });
Object.defineProperty(exports, "CardContent", { enumerable: true, get: function () { return Card_1.CardContent; } });
Object.defineProperty(exports, "CardFooter", { enumerable: true, get: function () { return Card_1.CardFooter; } });
Object.defineProperty(exports, "CardTitle", { enumerable: true, get: function () { return Card_1.CardTitle; } });
Object.defineProperty(exports, "CardDescription", { enumerable: true, get: function () { return Card_1.CardDescription; } });
var DataTable_1 = require("./components/DataTable");
Object.defineProperty(exports, "DataTable", { enumerable: true, get: function () { return DataTable_1.DataTable; } });
// Layout & Feedback Components  
var Modal_1 = require("./components/Modal");
Object.defineProperty(exports, "Modal", { enumerable: true, get: function () { return Modal_1.Modal; } });
Object.defineProperty(exports, "ModalHeader", { enumerable: true, get: function () { return Modal_1.ModalHeader; } });
Object.defineProperty(exports, "ModalContent", { enumerable: true, get: function () { return Modal_1.ModalContent; } });
Object.defineProperty(exports, "ModalFooter", { enumerable: true, get: function () { return Modal_1.ModalFooter; } });
var Toast_1 = require("./components/Toast");
Object.defineProperty(exports, "Toast", { enumerable: true, get: function () { return Toast_1.Toast; } });
Object.defineProperty(exports, "ToastProvider", { enumerable: true, get: function () { return Toast_1.ToastProvider; } });
Object.defineProperty(exports, "ToastContainer", { enumerable: true, get: function () { return Toast_1.ToastContainer; } });
Object.defineProperty(exports, "useToast", { enumerable: true, get: function () { return Toast_1.useToast; } });
// Form Components
var FormField_1 = require("./components/FormField");
Object.defineProperty(exports, "FormField", { enumerable: true, get: function () { return FormField_1.FormField; } });
// Layout Components
var AppLayout_1 = require("./components/AppLayout");
Object.defineProperty(exports, "AppLayout", { enumerable: true, get: function () { return AppLayout_1.AppLayout; } });
var PageHeader_1 = require("./components/PageHeader");
Object.defineProperty(exports, "PageHeader", { enumerable: true, get: function () { return PageHeader_1.PageHeader; } });
var StatCard_1 = require("./components/StatCard");
Object.defineProperty(exports, "StatCard", { enumerable: true, get: function () { return StatCard_1.StatCard; } });
var ThemeProvider_1 = require("./components/ThemeProvider");
Object.defineProperty(exports, "ThemeProvider", { enumerable: true, get: function () { return ThemeProvider_1.ThemeProvider; } });
Object.defineProperty(exports, "useTheme", { enumerable: true, get: function () { return ThemeProvider_1.useTheme; } });
// Branding Components
var GangerLogo_1 = require("./components/GangerLogo");
Object.defineProperty(exports, "GangerLogo", { enumerable: true, get: function () { return GangerLogo_1.GangerLogo; } });
Object.defineProperty(exports, "GangerHeader", { enumerable: true, get: function () { return GangerLogo_1.GangerHeader; } });
Object.defineProperty(exports, "GangerLogoCompact", { enumerable: true, get: function () { return GangerLogo_1.GangerLogoCompact; } });
// Staff Portal Components
__exportStar(require("./staff"), exports);
// Utilities
var cn_1 = require("./utils/cn");
Object.defineProperty(exports, "cn", { enumerable: true, get: function () { return cn_1.cn; } });
// Design Tokens
var colors_1 = require("./tokens/colors");
Object.defineProperty(exports, "colors", { enumerable: true, get: function () { return colors_1.colors; } });
Object.defineProperty(exports, "cssVariables", { enumerable: true, get: function () { return colors_1.cssVariables; } });
Object.defineProperty(exports, "tailwindColors", { enumerable: true, get: function () { return colors_1.tailwindColors; } });
Object.defineProperty(exports, "colorUtils", { enumerable: true, get: function () { return colors_1.colorUtils; } });
// TODO: Additional components to implement
// export { AppLayout } from './components/AppLayout';
// export { PageHeader } from './components/PageHeader';
// export { NavigationTabs } from './components/NavigationTabs';
// export { FormBuilder } from './components/FormBuilder';
// export { DatePicker } from './components/DatePicker';
// export { Calendar } from './components/Calendar';
// export { Chart } from './components/Chart';
// export { Camera } from './components/Camera';
// export { StatCard } from './components/StatCard';
