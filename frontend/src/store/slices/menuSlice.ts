import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export interface FoodItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number;
}

export interface Menu {
  _id: string;
  name: string;
  description?: string;
  items: FoodItem[];
}

interface MenuState {
  menus: Menu[];
  loading: boolean;
  error: string | null;
}

const initialState: MenuState = {
  menus: [],
  loading: false,
  error: null,
};

export const fetchMenus = createAsyncThunk<Menu[], void, { rejectValue: string }>(
  'menu/fetchMenus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<Menu[]>('/api/menu');
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch menus');
    }
  }
);

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenus.fulfilled, (state, action: PayloadAction<Menu[]>) => {
        state.loading = false;
        state.menus = action.payload;
      })
      .addCase(fetchMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch menus';
      });
  },
});

export default menuSlice.reducer; 