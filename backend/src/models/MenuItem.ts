import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  restaurant: mongoose.Types.ObjectId;
  image: string;
  available: boolean;
}

const menuItemSchema = new Schema<IMenuItem>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  image: { type: String, required: true },
  available: { type: Boolean, default: true }
});

export default mongoose.model<IMenuItem>('MenuItem', menuItemSchema); 