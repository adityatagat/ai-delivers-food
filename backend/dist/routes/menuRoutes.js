"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const menuController_1 = require("../controllers/menuController");
const router = express_1.default.Router();
/**
 * @swagger
 * tags:
 *   name: Menu
 *   description: Menu and menu items management
 */
/**
 * @swagger
 * /api/menu:
 *   get:
 *     summary: Get all menus with their menu items
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: List of menus with their items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   items:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/FoodItem'
 *       500:
 *         description: An error occurred while fetching menus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching menus. Please try again later.
 */
router.get('/', menuController_1.getMenus);
exports.default = router;
