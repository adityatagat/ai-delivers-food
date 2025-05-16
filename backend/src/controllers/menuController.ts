import { Request, Response } from 'express';
import Menu from '../models/Menu';

export const getMenus = async (req: Request, res: Response) => {
  try {
    const menus = await Menu.find().populate('items');
    res.status(200).json(menus);
  } catch (err) {
    console.error('Error fetching menus:', err);
    res.status(500).json({ error: 'An error occurred while fetching menus. Please try again later.' });
  }
};
