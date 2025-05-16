"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenus = void 0;
const Menu_1 = __importDefault(require("../models/Menu"));
const getMenus = async (req, res) => {
    try {
        const menus = await Menu_1.default.find().populate('items');
        res.status(200).json(menus);
    }
    catch (err) {
        console.error('Error fetching menus:', err);
        res.status(500).json({ error: 'An error occurred while fetching menus. Please try again later.' });
    }
};
exports.getMenus = getMenus;
