import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  address: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  deliveryFee: number;
}

const restaurantSchema = new Schema<IRestaurant>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  cuisine: { type: String, required: true },
  rating: { type: Number, required: true },
  deliveryTime: { type: String, required: true },
  minOrder: { type: Number, required: true },
  deliveryFee: { type: Number, required: true }
});

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema); 