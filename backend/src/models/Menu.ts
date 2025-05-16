import mongoose, { Document, Schema } from 'mongoose';
import { IFoodItem } from './FoodItem';

export interface IMenu extends Document {
  name: string;
  description?: string;
  items: mongoose.Types.ObjectId[] | IFoodItem[];
}

const MenuSchema = new Schema<IMenu>({
  name: { type: String, required: true },
  description: { type: String },
  items: [{ type: Schema.Types.ObjectId, ref: 'FoodItem' }]
});

export default mongoose.model<IMenu>('Menu', MenuSchema);
